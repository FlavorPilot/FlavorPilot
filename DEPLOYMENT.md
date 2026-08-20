# Deployment

## Local Docker API

```bash
cp apps/api/.env.example apps/api/.env
docker compose up --build api
```

The Compose file reads `apps/api/.env`; the Next development app continues to read `apps/web/.env.local`.


## Frontend: Vercel

Configure the repository as a monorepo. The included `vercel.json` builds shared packages and `@tastecraft/web`.

Required production variables:

```dotenv
NEXT_PUBLIC_APP_URL=https://your-domain.example
NEXT_PUBLIC_API_URL=https://api.your-domain.example/v1
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Backend: Railway/Render/Fly/VPS

Use `apps/api/Dockerfile`. Railway configuration is included at `railway.json`.

Required variables:

```dotenv
NODE_ENV=production
API_HOST=0.0.0.0
# Railway/Render may inject PORT automatically. It takes precedence over API_PORT.
PORT=
API_PORT=4000
CORS_ORIGINS=https://your-domain.example
DATABASE_URL=postgresql://...
DATABASE_SSL=require
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
```

`OPENAI_API_KEY` is optional until the explanation feature is enabled. Leave `PORT` empty locally; container platforms may populate it automatically.

## Production checklist

- run SQL through versioned migrations;
- use a Supabase pooler URL appropriate for the hosting model;
- restrict CORS exactly;
- configure rate limiting for AI and mutation endpoints;
- add structured logs/error monitoring;
- configure database backups and PITR;
- test owner/non-owner/public/unlisted/private access and immutable remix lineage;
- add payment webhooks before trusting subscription status;
- rotate all secrets after staging;
- load-test public discovery and analysis separately;
- run `npm run validate && npm run build` from a clean checkout before release.
