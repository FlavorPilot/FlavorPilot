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

Keep `AI_ENABLED=false` until the recipe/AI migration and matching API/web have passed checks.
For an approved pilot, set server-only OPENAI_API_KEY, OPENAI_MODEL=gpt-5.4-mini-2026-03-17,
AI_PILOT_USER_IDS to the explicitly approved UUIDs, AI_DAILY_BUDGET_USD=5 and
AI_MONTHLY_BUDGET_USD=50. Only then enable AI_ENABLED. The pilot grant does not upgrade a
subscription. Set AI_ENABLED=false and restart to stop new calls; in-flight calls can still bill.
Usage budgets are enforced by Nest reservations; an external dashboard alert is not the control.
Set `CORS_ORIGINS` to the exact web origin, for example `https://staging.flavorpilot.example`.
A wildcard is rejected in production. Put `DATABASE_URL`, `SUPABASE_URL` and
`SUPABASE_PUBLISHABLE_KEY` only in the API host's secret storage. The web build receives
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
After creating the Supabase project, add `/en/auth/callback`, `/uk/auth/callback` and the same
paths with `?mode=recovery` to the Auth redirect URLs. Apply `supabase/schema.sql`, then
`supabase/seed.sql`, on an empty project. Readiness is `database: connected`, not merely HTTP 200.

For the current web domain, set Auth Site URL to `https://flavor-pilot-web.vercel.app` and allow
the exact `/en/auth/callback` and `/uk/auth/callback` URLs, with and without `?mode=recovery`.
This hosted configuration was corrected and HTTP redirect destinations checked on 2026-10-18.
It does not establish successful email delivery or a complete confirmation/recovery flow.

Configure a custom SMTP sender before general signup. Supabase's built-in mail service currently
allows only two messages per hour across the project, and recipients must be organization team
members. Confirmation and recovery share the quota. A `200` on repeated signup does not prove
that another email was sent or change an existing password; responses can conceal account
existence. The UI translates known Auth error codes, distinguishes invalid credentials from
email limits, and leaves unknown/provider details generic. Do not disable confirmation or
automatically change account passwords to work around a mail quota. See [Supabase SMTP docs](https://supabase.com/docs/guides/auth/auth-smtp).

## Release gate

Require native green build/test, tested schema migration, real 2-user permission tests,
private/share token checks, session callback tests, monitored readiness (not just process health),
backups with restoration, rollback, redacted logs, abuse/rate limits and domain/HTTPS configuration.
Do not enable production AI or payments just to show a working button. Neither is release-ready.
