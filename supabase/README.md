# Supabase/PostgreSQL setup

1. Create a Supabase project.
2. Execute `schema.sql`.
3. Execute `seed.sql`.
4. Set the PostgreSQL pooler/direct URL as `DATABASE_URL` in the Nest API.
5. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the API for bearer-token validation.
6. Set the corresponding `NEXT_PUBLIC_*` values in the web app for the future sign-in flow.

Never expose a database URL or service-role key to the browser.

## Unlisted dishes

Nest serves them at `GET /v1/dishes/share/:token` after checking that visibility is not private. The SQL `get_shared_dish(uuid)` function remains available for tightly controlled direct-Supabase clients.

## Regenerating knowledge seed

After editing `packages/flavor-engine/src/ingredients.ts`:

```bash
npm run generate:seed
```

Review the generated SQL diff before applying it. The demo values require independent culinary validation.
