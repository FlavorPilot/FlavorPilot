# Deployment handoff — not a completed deployment

## Web / Vercel

Use the monorepo repository with project Root Directory `apps/web` and enable inclusion of source
files outside that directory. `apps/web/vercel.json` sets the Next.js preset and runs installation
and the build from the repository root with the committed lockfile. `NEXT_PUBLIC_*` values must
exist at build time. `output: 'standalone'` remains for a self-hosted Next server. On Vercel it is
disabled because Next.js 16.3 does not emit `.next/next-server.js.nft.json` for the injected deploy
adapter. No completed Vercel deployment is claimed here.

## Nest container

Build from root: `docker build -f apps/api/Dockerfile -t flavorpilot-api .`.
The image builds actual workspaces and prunes dev dependencies. It runs as non-root node.
For development, after setup: `docker compose up --build api`. The local compose bind is loopback.
Set real DB/Auth values using the hosting provider's secret storage, never image build args.
Require the committed lockfile for any release. On 2026-09-23 the image `flavorpilot-api` built
from this Dockerfile and started with `NODE_ENV=production` and `AI_ENABLED=false`. Without
`DATABASE_URL`, `GET /v1/health` returned `status: ok` and `database: not_configured`. The same
image exited when `AI_ENABLED=true`. The image was not pushed to a registry or deployed.

Nest binds API_HOST 0.0.0.0 and uses platform PORT before API_PORT. Default health path /v1/health.
Specify allowed CORS origins. trustProxy is false: configure explicit trusted hops/networks only
after the actual ingress topology is known. Forwarded client-IP headers alone are untrusted.

## Staging values

Keep `AI_ENABLED=false`. Production startup rejects `AI_ENABLED=true` until usage quotas exist.
Set `CORS_ORIGINS` to the exact web origin, for example `https://staging.flavorpilot.example`.
A wildcard is rejected in production. Put `DATABASE_URL`, `SUPABASE_URL` and
`SUPABASE_PUBLISHABLE_KEY` only in the API host's secret storage. The web build receives
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
After creating the Supabase project, add `/en/auth/callback`, `/uk/auth/callback` and the same
paths with `?mode=recovery` to the Auth redirect URLs. Apply `supabase/schema.sql`, then
`supabase/seed.sql`, on an empty project. Readiness is `database: connected`, not merely HTTP 200.

## Release gate

Require native green build/test, tested schema migration, real 2-user permission tests,
private/share token checks, session callback tests, monitored readiness (not just process health),
backups with restoration, rollback, redacted logs, abuse/rate limits and domain/HTTPS configuration.
Do not enable production AI or payments just to show a working button. Neither is release-ready.
