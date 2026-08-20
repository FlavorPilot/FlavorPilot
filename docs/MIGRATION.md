# Migration from Next.js full-stack to Next.js + NestJS

## Moved out of Next.js

- `/api/analyze` → `POST /v1/flavor/analyze`
- `/api/ai/explain` → `POST /v1/ai/explain`
- dish persistence, visibility and remix rules → `DishesModule`
- token validation → `AuthModule`
- PostgreSQL access → `DatabaseModule`

The `apps/web/src/app/api` directory is intentionally absent.

## Preserved

- all English/Ukrainian pages;
- constructor UX;
- local browser library and offline/demo fallback;
- deterministic formulas;
- ingredient/preparation catalog;
- Supabase SQL model.

## New boundary

```text
apps/web             HTTP client             apps/api
React/Next.js  ───────────────────────────▶  NestJS/Fastify
     │                                           │
     └──── @flavorpilot/flavor-engine ◀───────────┘
```

## Next implementation milestone

Connect sign-in screens and replace local-only save actions with authenticated API calls while retaining local drafts for anonymous users.
