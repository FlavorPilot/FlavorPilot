# Database setup and migration

## Fresh Supabase project

Run `supabase/schema.sql`, then `supabase/seed.sql` in a new project. The schema needs Supabase
`auth.users`, `auth.uid()`, `anon` and `authenticated` roles; it is not a standalone PostgreSQL
bootstrap. Do not run it on a nonempty existing database: types and tables are created afresh.

Tables: profiles, ingredients, preparation_methods, ingredient_pairings, dishes, dish_items,
dish_versions, favorites, subscriptions. No paying users, fake accounts or public recipes are
seeded. The seed inserts unreviewed catalogue hypotheses with `confidence=0` and does not replace
existing records. The application currently calculates from the bundled catalogue, not live DB
edits: change the catalogue through review, rebuild packages, then regenerate/reconcile seed.

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

Create two test users. As A save a private recipe; B and anonymous clients must not read or edit
it by ID. Public recipes can be read but only A can edit. A valid unlisted token can read its
recipe; a guessed UUID cannot. Making a recipe private disables token access. Verify the owner
can keep/edit existing private recipes after downgrade; new private entries are limited. Send
concurrent create requests to validate the owner lock. Verify snapshots commit with item changes.

The API service applies explicit filters even when direct DB sessions bypass RLS. RLS policy
presence alone is not proof of tenant isolation. Database and auth provider errors must never
expose full connection strings, query parameters or recipes in logs.

## Rollback

Do not reverse grants automatically on a production database. Roll back the API application and
review whether old clients still require direct Data API access. Keep private access closed until
review. Restore from the tested backup only with an explicit data-loss/window decision. No
migration is automatically applied by this archive, setup script or Docker build.
