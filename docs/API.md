# API contract — widget rebuild r2

Default prefix `/v1`; protected routes require a Supabase `Authorization: Bearer <access-token>`.
The browser never sends a trusted user ID, plan or score. The API verifies bearer tokens via
Supabase's user endpoint with a timeout. A decode-only JWT implementation is not acceptable.

Public: GET /health, POST /flavor/analyze, GET /dishes/public, GET /dishes/public/:id,
GET /dishes/share/:token. Protected: GET /dishes/me, GET /dishes/me/:id, POST /dishes,
PATCH /dishes/:id, DELETE /dishes/:id, POST /dishes/:id/remix, POST /ai/explain.

Requests/response structures are in packages/contracts/src. Every ingredient/preparation pair
must resolve in the kernel catalogue. Save requires 1–24 items; live analysis accepts an empty
composition. Per-row grams must be finite, positive and <=5000. Existing canonical IDs do not
change with the interface language. Exact repeat ingredient/method rows are rejected.

`POST /flavor/analyze` includes `composition` with six nutrient totals. Each total contains
`coveredItems`, `totalItems`, and `contributions`: ingredient/preparation IDs, grams, nullable
`per100g`/`amount`, nullable `fdcId`/`sourceDescription`. Contributions retain full precision;
totals round only after summing (grams: one decimal; mg/kcal: integer). A missing amount stays
null and is not included; published zero is covered. These source-reference amounts do not
apply cooking-loss/yield factors and never affect the culinary score. Contracts parse this
composition instead of stripping it from the server response. Rebuild the API and web together.

### Recommendation response — model 0.3.1-hypothesis

Each recommendation now includes `preparationId`, positive integer `overallDelta`, integer
`balanceDelta`, and up to three `profileChanges` (`dimension`, `before`, `after`, sensory scale
0–10). Deltas subtract the same rounded scores displayed in preview. `improvesModel` is an
additional localized reason; it replaces the unsupported fallback claim of strong pairing.
The original compatibility/usefulness fields remain heuristic scores, not probabilities.

The engine searches the full scoring catalogue excluding existing ingredient IDs. It compares
portions at the catalogue minimum and ideal **final-dish shares** using
`grams = currentWeight * share / (100 - share)`, bounded to 0.1–5000 g, the working maximum
and ideal share. The maximum is a guard rather than a target for diluting the original dish.
Within each food, the best unrounded overall score wins; ties prefer the ideal share then
the smaller dose. Rank by actual overall improvement, then the existing usefulness formula,
then stable ingredient ID. Keep the existing compatibility/balance eligibility gate and require
a positive displayed overall delta. Show at most eight distinct role/prepared-texture groups
(six cards in the web UI); no filler when fewer qualify. Empty and 24-item dishes return none.
Existing preparations, all primary score coefficients, and manual-add default amounts are unchanged.
Reasons use the prepared candidate and actual simulated profile/texture changes, not its name.

Migration: rebuild shared contracts/engine, API and web together. No SQL migration or rewriting
stored recipes/feedback is required. Feedback snapshots already omit recommendations; preserve
their original model versions. Fresh feedback uses 0.3.1; an old open client may need reloading
after the API update to pass the existing version check. Catalogue version/profiles are unchanged.

## Feedback and comments

Protected: `POST /feedback`, `GET /feedback/:id`, `DELETE /feedback/:id` (owner only).
Feedback snapshots are private, recomputed server-side and bound to model/catalogue versions;
before/after-cooking reports are distinct. Extra client score/owner fields are rejected.

Public recipes only: `GET /dishes/:dishId/comments?limit=20&cursor=...` (compound timestamp/UUID
cursor), `POST /dishes/:dishId/comments` (authenticated text/hasCooked/parentId/versionNumber),
`DELETE /dishes/:dishId/comments/:id` (comment author only; body cleared, replies preserved).
Private/unlisted discussions return 404. Stale recipe versions return 409. Dish responses now
include `versionNumber`; the contract defaults older responses to 1 for compatibility.
See [FEEDBACK.md](FEEDBACK.md) for schemas, ownership, snapshots and error/retry behavior.

## Administration and support

`/admin/*` requires a verified session, active server owner assignment, and MFA for data routes.
`/support/*` is authenticated and owner-scoped; staff paths are separately guarded.
`GET /feedback/mine` and `PATCH /feedback/:id/permission` let an author inspect permission
metadata and withdraw team review. Earlier feedback remains closed by default.
Dish responses include `moderationHidden` (default false for old responses). Public, shared,
discussion and remix paths enforce distribution restrictions without rewriting author visibility.
See [ADMINISTRATION.md](ADMINISTRATION.md) for all routes, pagination, conflicts and bootstrap.

## AI request change

The r2 request is composition-based, NOT the old `analysis` object:

```json
{
  "locale": "en",
  "dishName": "A working composition",
  "goal": "fresh",
  "items": [
    {"ingredientId":"salmon","grams":180,"preparationId":"raw"},
    {"ingredientId":"lime","grams":12,"preparationId":"raw"}
  ]
}
```

The controller parses and validates, computes server analysis and only then invokes AiService.
Default `AI_ENABLED=false`; enabling it under production is rejected pending actual quotas.
Response keeps `summary`, `main_problem`, `actions`. Text does not become a trusted recipe or
score. `store:false`, timeout and output token limit are safeguards, not a complete cost policy.

## Privacy and known limits

Public/shared serializers omit shareToken; owners receive it. All dish reads use no-store.
Public cursor remains timestamp-only, so equal publication timestamps need future tie-breaking.
Mine currently returns up to 100 recipes. No version-history browsing or token-rotation endpoint
is claimed. API/DB tests with two distinct accounts are still required before external usage.
