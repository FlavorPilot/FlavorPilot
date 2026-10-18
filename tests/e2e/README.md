# Browser E2E

Playwright covers the critical path in `critical.spec.ts`: signup and login, the builder,
local save, reload, edit, private visibility, a public dish, an unlisted link, remix, delete,
language switch, the mobile builder, and an API failure that leaves the local draft in place.

`recipe-instructions.spec.ts` covers the second builder tab: keyboard navigation, grouped
undo/redo, step reordering and deletion, device persistence, EN/UK text preservation,
servings validation, mobile overflow and JSON v2 round trips before adding ingredients.

`composition-reference.spec.ts` covers nutrient-specific coverage/missing rows, source links,
hover and keyboard access, Escape, touch, Ukrainian names from the expanded catalogue and
popover containment on a 375 px screen. The local database seed has 620 ingredients; API
integration also checks migration 0008 and saving recipes with new ingredients.

The browser does not call staging Supabase. `tests/e2e/serve.mjs` resets a local
`flavorpilot_test` database, starts an auth stub, and starts the Nest API. Playwright then
starts Next with that stub. `npm run test:integration` checks the same database through Nest:
two users, ownership, visibility, the private-dish limit, versions, concurrent writes, remix
parentage, and share-token revocation.

```bash
docker run -d --name flavorpilot-test-pg \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=flavorpilot_test \
  -p 127.0.0.1:54329:5432 postgres:16
npm run test:integration
npm run test:e2e
```

`FLAVORPILOT_TEST_DATABASE_URL` overrides the default
`postgres://postgres:postgres@127.0.0.1:54329/flavorpilot_test`. The reset refuses any URL
that is not local and not named `flavorpilot_test`.
