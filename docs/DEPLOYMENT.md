# Deployment handoff — not a completed deployment

## Web / Vercel

Use the monorepo repository with project Root Directory `apps/web`; include source files outside
that directory in the build. Install from the repository root with the actual committed lockfile.
An explicit command from apps/web is `cd ../.. && npm ci --include=optional` for installation and
`cd ../.. && npm run build:packages && npm run build --workspace @flavorpilot/web` for build.
Use the Next.js framework preset; environment values NEXT_PUBLIC_* must exist at build time.
Platform UI/monorepo settings need verification in the real project; no live deployment was run.

## Nest container

Build from root: `docker build -f apps/api/Dockerfile -t flavorpilot-api .`.
The image builds actual workspaces and prunes dev dependencies. It runs as non-root node.
For development, after setup: `docker compose up --build api`. The local compose bind is loopback.
Set real DB/Auth values using the hosting provider's secret storage, never image build args.
Dockerfile supports the first unlocked install for bootstrapping; require a committed lockfile
for any release. Docker was not built/tested in this preparation environment.

Nest binds API_HOST 0.0.0.0 and uses platform PORT before API_PORT. Default health path /v1/health.
Specify allowed CORS origins. trustProxy is false: configure explicit trusted hops/networks only
after the actual ingress topology is known. Forwarded client-IP headers alone are untrusted.

## Release gate

Require native green build/test, tested schema migration, real 2-user permission tests,
private/share token checks, session callback tests, monitored readiness (not just process health),
backups with restoration, rollback, redacted logs, abuse/rate limits and domain/HTTPS configuration.
Do not enable production AI or payments just to show a working button. Neither is release-ready.
