# Database setup and migration

## Fresh Supabase project

Run `supabase/schema.sql`, then `supabase/seed.sql` in a new project. The schema needs Supabase
`auth.users`, `auth.uid()`, `anon` and `authenticated` roles; it is not a standalone PostgreSQL
bootstrap. Do not run it on a nonempty existing database: types and tables are created afresh.

Tables: profiles, ingredients, preparation_methods, ingredient_pairings, dishes, dish_items,
dish_versions, favorites, subscriptions, model_feedback, dish_comments, admin_memberships,
admin_audit_events, feedback_reviews, support_tickets, support_messages. No paying users, fake
accounts or public recipes are seeded. The seed inserts unreviewed catalogue hypotheses with `confidence=0` and does not replace
existing records. The application currently calculates from the bundled catalogue, not live DB
edits: change the catalogue through review, rebuild packages, then regenerate/reconcile seed.

## Knowledge provenance

`supabase/migrations/0003_knowledge_provenance.sql` adds source, license, reviewer, review
status, model version and last-reviewed time to ingredients, preparation methods and pairings.
Ingredients also gain `preparation_effect_overrides`, which stays null until a review records
an ingredient-specific effect. A `reviewed` row must name a reviewer, a source and a review
time. Existing rows stay `unreviewed`. Apply 0003 once to a database created from the older
schema. A fresh database already includes these columns in `supabase/schema.sql`. Do not rerun
`schema.sql` on a nonempty database, and do not regenerate `seed.sql` over reviewed rows.

`supabase/migrations/0004_ingredient_identities.sql` adds public identity citations.
`supabase/seed-identities.sql` inserts the USDA rows and does not overwrite an existing id.
Apply 0004, then the identity seed, on a database that already has 0003. Fresh installs get
the table from `schema.sql` and the rows from the identity seed after `seed.sql`.

`supabase/migrations/0005_nutrient_hypotheses.sql` stores `nutrient-proxy-1` scores beside
those identities. Apply it after 0004, then `supabase/seed-nutrient-hypotheses.sql`.
`supabase/seed-scoring-hypotheses.sql` inserts the 582 USDA foods that are not already in
`ingredients`, so a saved dish can reference them. It refreshes an unreviewed row and does not overwrite a reviewed one. The transcribed 38 are not in that file.
`supabase/migrations/0006_product_hypotheses.sql` replaces earlier nutrient-density placeholders on an existing database. Apply it after 0005.
`supabase/migrations/0007_composition_nutrients.sql` adds published protein, carbohydrate and energy amounts. Apply it after 0006. Those amounts feed the composition reference, not the dish score.

`supabase/migrations/0008_catalogue_expansion.sql` expands an existing installation after 0007
to 620 scoring ingredients and 619 USDA identities/nutrient records. It is a data-only transaction:
upserts of scoring/nutrient rows only update `unreviewed` rows; identity conflicts are left alone.
Reviewed records, dishes, ownership, subscriptions and visibility are preserved. Run this on a
staging copy before the production database. The application/API packages must also be rebuilt:
the calculation catalogue is bundled, not read from the seed at runtime.

For a fresh install, run `schema.sql`, `seed.sql`, `seed-identities.sql`,
`seed-nutrient-hypotheses.sql`, then `seed-scoring-hypotheses.sql`. The seeds include this expansion;
0008 is not additionally required on a freshly seeded database. Generation and source checks are
documented in [CATALOGUE.md](CATALOGUE.md). No remote migration is run by the generator or build.

## Feedback and discussion

Apply `supabase/migrations/0009_model_feedback_and_comments.sql` after 0008 for private
`model_feedback` and public-recipe `dish_comments`. Fresh `schema.sql` includes both. The
migration adds tables/indexes/constraints and a same-recipe, one-level reply validation trigger;
it does not alter recipes, catalogue scores or visibility. Both tables have RLS and direct
public/anon/authenticated privileges revoked; Nest enforces current visibility and ownership.
See [FEEDBACK.md](FEEDBACK.md). Deploy the API/web together after the migration.

## Administration and support

Apply `supabase/migrations/0010_administration.sql` after 0009. It adds admin_memberships,
admin_audit_events, feedback_reviews, support_tickets and support_messages; all deny direct
public/anon/authenticated access. Recipe moderation state/revision is separate from visibility;
existing feedback gains a false-by-default team-review permission. Fresh schema includes both.
No owner is promoted automatically. Use the controlled procedure in
[ADMINISTRATION.md](ADMINISTRATION.md). Apply the migration before matching API/web bundles.

## Existing v0.3.0 database

Back up and verify a restorable copy first. Test on a separate staging copy with two users.
Apply `supabase/migrations/0002_widget_hardening.sql` once, in a maintenance window. It changes
capacity enforcement and grants; it does not delete stored dishes. It is included but was not
executed against a PostgreSQL/Supabase server in the build environment.

Critical behavior change: anon/authenticated cannot directly CRUD dishes/items/versions,
favorites/subscriptions through Supabase Data API. Use Nest endpoints. `get_shared_dish` stays
defined for compatibility but direct client EXECUTE is revoked. Do not blindly regrant it.
The browser uses Supabase for Auth only; the API holds a trusted server-only DB connection.
No service-role key or database password belongs in frontend variables.

## Verification after migration

Apply `supabase/migrations/20261018122502_harden_trigger_function_permissions.sql` after 0010
on existing installations. Fresh `schema.sql` includes it. The migration pins the search path
of two helpers and revokes direct PUBLIC/anon/authenticated execution of five internal trigger
functions. PostgreSQL still invokes the triggers; signup continues to create a profile and
subscription. It changes no account credentials, memberships, recipe contents or visibility.
Integration tests check repeat application, denied direct calls and successful signup.

Create two test users. As A save a private recipe; B and anonymous clients must not read or edit
it by ID. Public recipes can be read but only A can edit. A valid unlisted token can read its
recipe; a guessed UUID cannot. Making a recipe private disables token access. Verify the owner
can keep/edit existing private recipes after downgrade; new private entries are limited. Send
concurrent create requests to validate the owner lock. Verify snapshots commit with item changes.

The API service applies explicit filters even when direct DB sessions bypass RLS. RLS policy
presence alone is not proof of tenant isolation. Database and auth provider errors must never
expose full connection strings, query parameters or recipes in logs.

## Recipe content and AI usage

Apply `supabase/migrations/20261018125915_recipe_cloud_and_ai_usage.sql` after trigger hardening,
before deploying the matching API/web. The repeatable additive migration adds nullable servings,
default-empty validated steps and two closed AI tables. Existing recipes, ownership, visibility,
subscriptions and version snapshots are preserved; legacy snapshots may omit new fields.
Fresh schema includes the same definitions. No paid access is seeded.

`ai_requests` records account/request identity, content hash, model/prompt, status, units,
monetary reservation, token usage and elapsed time. `ai_response_cache` holds private generated
results for 30 minutes and is never exposed as a public recipe field. Both enable RLS and revoke
all public/anon/authenticated privileges. Nest uses a global transaction advisory lock for short
reservation/settlement transactions; no database lock remains held during provider HTTP calls.
See [API.md](API.md) for quotas, timeout reservations and remaining reconciliation limitations.

## Rollback procedure

Do not reverse grants automatically on a production database. Roll back the API application and
review whether old clients still require direct Data API access. Keep private access closed until
review. Restore from the tested backup only with an explicit data-loss/window decision. No
migration is automatically applied by this archive, setup script or Docker build.
