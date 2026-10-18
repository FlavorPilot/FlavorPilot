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
Default `AI_ENABLED=false`. Every generation uses the same database-backed entitlement,
quota and budget reservation. `requestId` is optional for legacy explain clients; new clients
always send a UUID and retain it for retries. Response keeps `summary`, `main_problem`,
`actions` (at most three). Text does not become a trusted recipe or score.

`GET /v1/account/capabilities` returns availability, paid/pilot access, monthly/daily remaining
check units and UTC reset times. `POST /v1/ai/review-recipe` accepts a UUID requestId, EN/UK
locale, scope `step` or `full`, optional activeStepId/dishId, and a recipe snapshot with name,
goal, items, description, servings and ordered steps. A dishId requires current ownership.
Responses contain validated comments, server contentHash, requestId and refreshed quota.
Comments may suggest replacing one existing step; they cannot mutate recipes or scores.

Limits: explain 3000 input/2000 output/2 units; step 5000/1600/1; full 12000/4000/4.
Input counting uses OpenAI's `/responses/input_tokens` with the complete formatted input.
Output includes invisible tokens. Maximum one active generation/account, four fresh attempts
per minute and 20 seconds between step attempts. Pro: 300/month, 30/day; Studio: 1200/100;
Kitchen: 3000/200. Free has no generation entitlement. Explicit pilot UUIDs use Pro quotas
without changing their subscription. All periods use calendar UTC, not browser time.

The configured model is `gpt-6-luna`, reasoning none, strict JSON and `store:false`.
Use the documented public model ID; no dated Luna snapshot is currently published. Requests
force service_tier=default and prompt_cache_options.mode=explicit without breakpoints, avoiding
Fast pricing and implicit cache-write charges. Application result caching is separate.
Standard short-context prices are $0.10/M input and $0.50/M output tokens: full review reserves
at most $0.0032. Limits stay below the 272K long-context price threshold. Sources:
[Luna model](https://developers.openai.com/api/docs/models/gpt-6-luna),
[cache-write behavior](https://developers.openai.com/api/docs/guides/prompt-caching).
Startup rejects an enabled unpriced model or missing key/DB. Budgets default to $5/day and
$50/month; changes require trusted server configuration and restart. Reserve the worst-case
cost under a global transaction lock, then settle actual usage, without assuming cache discounts.
Failed results return user units; known provider usage remains billed. Unknown outcomes retain
the full monetary reservation and are never retried automatically. Crashed 90-second leases
become unknown; reservations remain charged against their original period until operator
reconciliation. There is no automatic uncertain-charge reconciliation yet.

Exact account/snapshot/model/prompt/language results have a private 30-minute cache; new IDs
for cache hits consume no units. Expired responses are deleted on subsequent reservations.
The journal holds metadata and token counts, not recipe bodies or credentials; the separate
closed cache necessarily contains generated text. Both deny direct Data API access.
Stable errors include AI_PLAN_REQUIRED, AI_QUOTA_EXCEEDED, AI_RATE_LIMITED,
AI_BUDGET_EXCEEDED, AI_INPUT_TOO_LARGE, AI_REQUEST_PENDING, AI_REQUEST_FINISHED,
AI_REQUEST_CONFLICT, AI_RESPONSE_INCOMPLETE and AI_PROVIDER_UNAVAILABLE.
Server-only provider diagnostics retain allowlisted error labels and bounded request IDs.
For a recognized model-access denial, extract the project ID to reconcile dashboard settings
with the deployed key's project. Never log raw provider messages, keys or recipe bodies.

Cloud create/read/version/remix now include servings and steps (legacy defaults null/[]).
PATCH preserves omitted fields and accepts expectedVersionNumber for optimistic concurrency;
a stale supplied version returns DISH_UPDATE_CONFLICT without overwriting the draft.

## Privacy and known limits

Public/shared serializers omit shareToken; owners receive it. All dish reads use no-store.
Public cursor remains timestamp-only, so equal publication timestamps need future tie-breaking.
Mine currently returns up to 100 recipes. No version-history browsing or token-rotation endpoint
is claimed. API/DB tests with two distinct accounts are still required before external usage.
