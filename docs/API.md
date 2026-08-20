# API

Base URL in development: `http://localhost:4000/v1`

Swagger UI: `http://localhost:4000/docs`

## Public endpoints

```text
GET    /health
POST   /flavor/analyze
GET    /dishes/public
GET    /dishes/public/:id
GET    /dishes/share/:token
```

## Authenticated endpoints

Send a Supabase access token:

```http
Authorization: Bearer <access-token>
```

```text
POST   /ai/explain
GET    /dishes/me
GET    /dishes/me/:id
POST   /dishes
PATCH  /dishes/:id
DELETE /dishes/:id
POST   /dishes/:id/remix
```

## Flavor analysis

```json
{
  "goal": "fresh",
  "includeRecommendations": true,
  "items": [
    { "ingredientId": "salmon", "grams": 180, "preparationId": "raw" },
    { "ingredientId": "avocado", "grams": 80, "preparationId": "raw" },
    { "ingredientId": "lime", "grams": 12, "preparationId": "raw" }
  ]
}
```

The response contains overall, compatibility, balance, quantity and texture scores, confidence, sensory profile, pair results, issues and recommendations. The server rejects catalog references it cannot evaluate: unknown ingredients, unknown preparations, preparations unsupported by a selected ingredient, and duplicate ingredient/preparation rows.

## Error shape

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": {},
  "requestId": "req-1",
  "timestamp": "2026-08-20T00:00:00.000Z",
  "path": "/v1/flavor/analyze"
}
```

## Authentication implementation

The current guard validates a bearer token through Supabase's authenticated-user endpoint. It is intentionally simple for the first release. At higher traffic, replace the network call with local verification against Supabase JWKS plus a short-lived key cache.

Dish updates cannot change `parentDishId`; remix ancestry is assigned only when the dish is created.
