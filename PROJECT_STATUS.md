# Project status — v0.2.0

## Completed

- Next.js frontend moved to `apps/web`.
- NestJS/Fastify API created in `apps/api`.
- Flavor Engine extracted into a framework-independent package.
- Shared Zod contracts extracted.
- Next API routes removed.
- Health, flavor, AI, auth and dish modules implemented.
- PostgreSQL/Drizzle query layer added.
- Strict catalog validation added to server analysis and persistence.
- Private-dish entitlement requires an active/trialing paid subscription, with the rule duplicated in PostgreSQL.
- Remix ancestry made immutable after creation.
- Dependency-free structural validation added (`28/28` checks at packaging time).
- Public/private/unlisted dishes, versions and remixes implemented server-side.
- Docker, Railway and Vercel deployment scaffolding added.
- English and Ukrainian UI preserved.
- Public discovery can consume Nest API with a bundled fallback.

## Still required before production

- sign-in/sign-up screens and callback flow;
- connect builder save/update/delete to authenticated endpoints;
- subscription/payment provider and webhooks;
- rate limiting and observability;
- moderated social interactions;
- independently validated ingredient knowledge base;
- full installed dependency build and browser E2E run in a network-enabled environment (npm registry access timed out while packaging).
