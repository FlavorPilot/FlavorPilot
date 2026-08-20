# TasteCraft

A bilingual (English/Ukrainian) culinary construction platform built as a TypeScript monorepo.

The architecture is deliberately split:

- **Next.js** owns UI, SSR/SEO, i18n and the interactive browser experience.
- **NestJS + Fastify** owns the authoritative API, authorization, persistence, privacy rules, AI access and future billing.
- **`@tastecraft/flavor-engine`** owns every deterministic culinary score.
- **`@tastecraft/contracts`** owns shared runtime validation and API types.
- **PostgreSQL/Supabase** stores users, dishes, versions, remix lineage and subscriptions.

The LLM never calculates compatibility. It may only explain an already calculated result.

## Repository layout

```text
apps/
  web/                    Next.js 16 / React 19 frontend
  api/                    NestJS 11 / Fastify API
packages/
  contracts/              shared Zod contracts and TypeScript types
  flavor-engine/          ingredient catalog and deterministic formulas
supabase/
  schema.sql              production-oriented PostgreSQL/RLS schema
  seed.sql                current demo knowledge seed
docs/
  ARCHITECTURE.md
  API.md
  DATABASE.md
  DEPLOYMENT.md
  FLAVOR_ENGINE.md
  MIGRATION.md
  VALIDATION.md
```

## Requirements

- Node.js 20.11 or newer
- npm 10 or newer
- optional Supabase/PostgreSQL project
- optional OpenAI API key

## Local start

```bash
npm install
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
npm run dev
```

Open:

- Web: `http://localhost:3000`
- API health: `http://localhost:4000/v1/health`
- Swagger: `http://localhost:4000/docs`

The browser constructor and local library work without external services. The Nest API starts without a database: health and deterministic flavor analysis remain available, while persistence endpoints return `503 DATABASE_NOT_CONFIGURED`.

## Useful commands

```bash
npm run dev              # web + API + package watchers
npm run dev:web          # Next only
npm run dev:api          # Nest only
npm run build            # packages, API, web
npm run validate:structure # dependency-free repository checks
npm run typecheck
npm test
npm run validate
npm run generate:seed
```

## Environment separation

Only the web app receives `NEXT_PUBLIC_*` values. Secrets belong exclusively to `apps/api/.env` or the backend hosting provider.

### Web

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/v1
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

### API

```dotenv
# Optional platform-assigned port; takes precedence over API_PORT.
PORT=
API_PORT=4000
CORS_ORIGINS=http://localhost:3000
DATABASE_URL=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
```

Never expose `DATABASE_URL`, an OpenAI key or a Supabase service-role secret to Next.js client code.

## Database setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Run `supabase/seed.sql`.
4. Put the pooler/direct PostgreSQL URL into `apps/api/.env` as `DATABASE_URL`.
5. Put the project URL and publishable key into both applications as documented above.

The SQL trigger and Nest service both enforce the Free plan limit of three private dishes. The API also rejects unknown ingredients, unknown or unsupported preparations, and duplicate ingredient/preparation rows before persistence or analysis.

## Current integration state

- The constructor calculates immediately in the browser using the shared package.
- `POST /v1/flavor/analyze` repeats the calculation authoritatively on the server.
- Discover reads public API dishes when the database is connected and falls back to bundled examples otherwise.
- Protected dish CRUD and AI endpoints validate Supabase bearer tokens.
- The existing UI still keeps a local-storage fallback until the sign-in screens are connected.

This is intentional: moving the backend does not make the visual MVP dependent on external infrastructure.

## Deployment

- Deploy `apps/web` to Vercel.
- Deploy the root `apps/api/Dockerfile` to Railway, Render, Fly.io or a VPS.
- Point `NEXT_PUBLIC_API_URL` at the public Nest URL.
- Restrict `CORS_ORIGINS` to the production web domain.

For a local API container, copy `apps/api/.env.example` to `apps/api/.env` and run `docker compose up --build api`. See `docs/DEPLOYMENT.md` for the full checklist.

## Data warning

The initial ingredient profiles and explicit pair adjustments are product hypotheses, not a validated scientific or culinary dataset. They must be independently reviewed, sourced and versioned before commercial claims are made. See `docs/VALIDATION.md` for the checks performed on this archive and the remaining build limitation.
