# Project status — v0.3.0

## Completed

- Product and internal package scope renamed to FlavorPilot.
- Correct npm-workspace monorepo structure restored.
- Next.js frontend lives in `apps/web`.
- NestJS/Fastify API lives in `apps/api`.
- Flavor Engine is isolated in a framework-independent package.
- Shared Zod contracts are isolated in a dedicated package.
- Health, flavor, AI, auth, database and dish modules are implemented.
- PostgreSQL/Drizzle query layer and Supabase authorization are scaffolded.
- Public/private/unlisted dishes, versions and remix lineage are implemented server-side.
- English and Ukrainian interfaces are included.
- Docker, Railway and Vercel deployment scaffolding is included.
- Dependency-free repository structure validation is included.

## Required before production

- install dependencies and commit the generated `package-lock.json`;
- run the full TypeScript, test and production build pipeline;
- add sign-in/sign-up screens and callback flow;
- connect builder save/update/delete to authenticated endpoints;
- add payment provider and subscription webhooks;
- add rate limiting, observability and error monitoring;
- add moderation for public content;
- independently validate and source the ingredient knowledge base;
- add browser end-to-end tests.
