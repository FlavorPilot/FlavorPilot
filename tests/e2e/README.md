# Browser E2E

`auth-errors.spec.ts` intercepts Auth responses to verify distinct invalid-credential and email
rate-limit copy, EN/UK localization, retained inputs, safe error text, explicit retry and mobile
containment. It never sends real emails or attempts real hosted account logins.

`recommendations.spec.ts` checks recalculation after changing grams, measured model deltas,
the exact preparation/amount in preview and Apply, preservation of the original during preview,
and Ukrainian keyboard-accessible details/preview at 375 px.

The suite uses isolated web/API/auth ports 3100/4100/55421 and an ignored `.next-e2e`
Next output directory. Normal development remains on 3000/4000. Optional overrides are
`FLAVORPILOT_E2E_WEB_PORT`, `FLAVORPILOT_E2E_API_PORT`, `FLAVORPILOT_E2E_AUTH_PORT`.

`feedback-discussion.spec.ts` checks private draft feedback (including preparation text),
retry without losing answers, stale-input feedback labels, owner/visitor separation, comments,
plain-text escaping, replies/deletion, recipe-version conflicts, preservation of comment drafts,
and Ukrainian discussion at mobile width. See [the feedback design](../../docs/FEEDBACK.md).

Playwright covers the critical path in `critical.spec.ts`: signup and login, the builder,
local save, reload, edit, private visibility, a public dish, an unlisted link, remix, delete,
language switch, the mobile builder, and an API failure that leaves the local draft in place.

`administration.spec.ts` covers active/revoked server assignments, denied ordinary accounts,
user cards without private contents, the UK catalogue at 375 px, feedback review/withdrawal,
publication restriction, audited reasons, and a two-user support conversation. A lost response
after a successful server write is retried without duplicating the ticket; refreshing retains
the user's unsent reply. Owner fixture writes are guarded to local `flavorpilot_test` only.
The auth stub explicitly disables MFA checks; production rejects that configuration. Real
Supabase MFA is a separate staging check. See [ADMINISTRATION.md](../../docs/ADMINISTRATION.md).
On Windows with reserved port 55421, set `FLAVORPILOT_E2E_AUTH_PORT=45421` for the test run.

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
