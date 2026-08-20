# Agent rules

1. `packages/flavor-engine` is the sole owner of culinary scores.
2. AI may explain an analysis; it may not calculate or modify scores.
3. All HTTP input must be parsed by `@flavorpilot/contracts` schemas.
4. Next.js must not acquire new product business logic or secret-bearing API routes.
5. NestJS remains a modular monolith until measured needs justify extraction.
6. Ownership, visibility and subscription rules must be enforced server-side.
7. Never expose `DATABASE_URL`, OpenAI keys or Supabase service-role credentials to browser code.
8. Every user-facing string added to the web app needs English and Ukrainian variants.
9. Ingredient data changes require provenance, confidence and regression tests.
10. Keep the anonymous local-storage demo working unless a task explicitly removes it.
