# Database

Canonical SQL is in `supabase/schema.sql`. Drizzle declarations in `apps/api/src/database/schema.ts` are the typed query layer, not a second migration source.

## Main tables

- `profiles`
- `ingredients`
- `preparation_methods`
- `ingredient_pairings`
- `dishes`
- `dish_items`
- `dish_versions`
- `favorites`
- `subscriptions`


## Knowledge-source authority

The current runtime Flavor Engine reads its ingredient, preparation and explicit-pair data from `packages/flavor-engine/src/ingredients.ts`. `supabase/seed.sql` is generated from that source with `npm run generate:seed`. Editing knowledge rows only in PostgreSQL does **not** change calculations in this MVP; keep the TypeScript catalog and generated seed synchronized until a versioned database-backed knowledge service replaces this arrangement.

## Visibility

- `public`: discoverable and readable by everyone;
- `unlisted`: readable with an opaque share token;
- `private`: owner only.

The API never returns `shareToken` from public endpoints. Owners receive it from authenticated endpoints. PostgreSQL owns `published_at`: it is set when a dish first becomes public, preserved on later edits, and cleared for non-public visibility, so a direct client cannot boost feed rank with an arbitrary timestamp.

## Versions and remixes

Each create/update writes a snapshot to `dish_versions`. `parent_dish_id` preserves attribution and enables a future remix tree. The parent can be selected only during creation, must be public or owned by the author, and is immutable through both the update contract and a PostgreSQL trigger. Deleting an original dish sets the child reference to `null` rather than deleting the remix; the trigger permits only this referential cleanup.

## Free-plan privacy limit

Nest checks the limit before writing for a friendly error. PostgreSQL repeats the check in `enforce_private_dish_limit()` so alternate trusted writers cannot bypass it. A non-Free tier bypasses the limit only while the subscription status is `active` or `trialing` and its period has not expired.

## RLS and server access

RLS remains useful for defense in depth and any direct Supabase clients. The Nest API also enforces ownership explicitly because a trusted PostgreSQL connection can use a role that bypasses RLS.

The database also verifies that every dish-item preparation is allowed by the ingredient catalog and caps each dish at 24 rows, matching the shared transport contract.

Never put `DATABASE_URL` or service-role credentials in the browser.
