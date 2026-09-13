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
