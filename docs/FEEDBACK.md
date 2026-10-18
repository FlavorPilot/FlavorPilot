# Model feedback and dish discussion

Two independent channels are implemented. Neither changes model coefficients, subscriptions,
recipe visibility or AI-provider settings. All new UI copy is in the EN/UK dictionaries.

## Private feedback on a prediction

The builder's assessment card offers feedback once there are two ingredients. An authenticated
author can rate the current draft, including device-only steps/servings, without publishing or
saving it as a cloud recipe. The confirmation form explains that sending uploads the recipe
snapshot and its analysis privately. Nothing is uploaded merely by opening the form. Public
recipe pages offer the same action only to the owner, not visitors or example recipes.

The author explicitly chooses whether they cooked this version. Agreement is `matches`,
`partial` or `missed`; partial/missed feedback can identify compatibility, balance, quantity
and texture concerns and include a 2,000-character note. Cooked status is self-reported.
Before-cooking opinions and after-cooking reports use different records; neither is a verified
measurement of taste. The model is not trained or adjusted automatically on submission.

`POST /v1/feedback` accepts a strict recipe snapshot, the client's model/catalogue versions,
optional owned cloud dish/version IDs, and feedback fields. It accepts no client analysis,
score or ownership claim. Nest validates references and recalculates using the kernel with
recommendations disabled. A model/catalogue mismatch returns 409. The stored snapshot contains
the full recipe context, computed analysis and exact model/catalogue version strings.
Calculation/preparation-rule changes must bump `MODEL_VERSION`; profile/catalogue changes
must bump `CATALOGUE_VERSION`, so later feedback cannot silently target different hypotheses.

If a linked cloud version exactly matches the submitted content, its version number is stored.
An edited/unsaved draft has a null cloud version but retains its complete immutable input and
analysis. The client carries saved cloud version numbers through library transfer/save/undo,
so an owner can review an earlier version even after another edit. Dish deletion detaches its
ID without rewriting the feedback snapshot. Own feedback can be retrieved/deleted using
`GET /v1/feedback/:id` and `DELETE /v1/feedback/:id`; other users receive 404.

A server-generated SHA-256 key covers model/catalogue versions, source dish/resolved version,
canonical recipe content and cooked status. The unique author/key index makes retries update
the same phase's answers instead of duplicating samples. Upserts update only agreement,
concerns, note and update time, preserving the captured input/analysis. In the form, successful
feedback is shown only for the input that was rated. Subsequent edits do not inherit it.
The in-page edit action restores the most recently submitted answers; a reloaded page may
submit again, with the server applying the same deduplication rule.

## Public comments on a recipe

`GET /v1/dishes/:dishId/comments` is available only while the recipe is public. A signed-in
user can post a 1–2,000-character plain-text comment, optionally self-report cooking this
version, or reply one level deep to an existing live root comment. The owner can reply too.
Comments never appear on examples, private recipes or unlisted-link pages.

Comments store the recipe version and public author profile, not access tokens, email or
share capabilities. `POST` requires the version shown to the writer; a changed recipe returns
409. The UI preserves the draft, lets the writer refresh the recipe and review it, and requires
another explicit Post action. Network failure also preserves the text. User text renders as
text, with line breaks; HTML/Markdown is not executed.

Only the comment author may delete via `DELETE /v1/dishes/:dishId/comments/:id`. Deletion
clears the stored body/cooking marker and returns a tombstone with no public author. Other
people's replies remain; parent quotes hide deleted text. An author may remove their own
words by ID even after visibility changes. Public reads/writes check current visibility under
a recipe row lock. Pagination is newest-first with a compound `(created_at, id)` cursor and
millisecond timestamp storage, including ties. The client merges pages by stable IDs.

There is no star rating, reputation system, automatic moderation, live subscription to new
comments, comment editing or model-training job in this delivery. Comments are qualitative
discussion; they are not automatically converted into taste-accuracy labels. Deleting an
account removes that account's comments; other authors' replies retain their text with a
detached parent where appropriate.

## Architecture and migration

Nest `FeedbackModule` owns both services and guarded mutations. Shared strict boundary
schemas live in `packages/contracts/src/feedback.ts`; tables are mapped in the API schema.
`model_feedback` is private and `dish_comments` is served through Nest visibility checks.
Both tables enable RLS and revoke direct access from public/anon/authenticated roles. A trusted
database connection still needs the service checks; RLS is not claimed to constrain that role.

The frontend uses `entities/feedback`, `entities/comment`, the `model-feedback` action and
`recipe-discussion` controller. The pure `recipe-comments` widget gets explicit state/actions;
the assessment widget accepts a React slot composed by the screen. No widget fetches or stores
data. Discussion mutations ignore stale responses after account/recipe changes.

Existing databases: apply `supabase/migrations/0009_model_feedback_and_comments.sql` after
0008, then deploy matching contracts/API/web bundles. The migration is additive and repeatable;
it does not publish recipes or modify scores. Fresh installs get the same tables from
`supabase/schema.sql`. Back up/test existing installations as described in DATABASE.md.
No hosted migration or deployment is performed by application builds or these generators.

## Local verification

Contracts cover strict caller fields, enum/length validation, cooked distinction, comments
and cursor validation. Real local PostgreSQL/API tests cover private feedback, recomputation,
source/history matching, deduplication, immutable snapshots after edits, visitor restrictions,
reply validation, deletion, privacy transitions, cursor ties, direct-role denial and repeated
migration. Browser tests cover the actual forms, two users, retry without text loss, stale
recipe refresh, escaped text, Ukrainian UI and narrow-screen layout.

Playwright uses dedicated ports 3100 (web), 4100 (API) and 55421 (auth stub), with optional
`FLAVORPILOT_E2E_WEB_PORT`, `FLAVORPILOT_E2E_API_PORT`, `FLAVORPILOT_E2E_AUTH_PORT` overrides.
Next's test build/cache uses ignored `.next-e2e` through `FLAVORPILOT_E2E=true`, so the normal
development server's `.next` output is not reused. The disposable database remains local
`flavorpilot_test`; its reset guard is unchanged.
