# Validation

## Checks completed for this archive

The dependency-free repository smoke test passes:

```bash
npm run validate:structure
```

Packaging result: **28/28 checks passed**. It verifies:

- required monorepo files and workspace declarations;
- valid JSON manifests;
- npm-compatible local workspace dependency versions;
- absence of generated `dist`, `.next`, `node_modules` and `*.tsbuildinfo` artifacts;
- absence of product API routes inside Next.js;
- English and Ukrainian locale declarations;
- relative TypeScript import resolution;
- presence of Nest modules and server-side catalog validation;
- PostgreSQL privacy, publication and remix safeguards;
- example environment files contain no populated secrets.

Additional independent checks completed while packaging:

- syntax transpilation of **66 TypeScript/TSX source files**;
- verification of **103 named imports** from the shared packages;
- catalog validation: **38 ingredients**, **12 preparation methods**, **64 explicit pair adjustments**, **4 bilingual demo dishes**;
- deterministic Flavor Engine runtime execution;
- regression scenario: adding 12 g lime to salmon, avocado and mayonnaise increased balance from **48 to 57** and overall score from **66 to 72**;
- Supabase seed regenerated and confirmed unchanged from the TypeScript catalog;
- lightweight SQL structural scan: **9 tables**, **8 functions**, **10 triggers**, **19 policies**;
- paid-entitlement runtime checks for active, trialing, free, canceled and expired plans;
- no populated secrets or generated build artifacts in the deliverable.

## Complete validation after installing dependencies

Run from a clean checkout:

```bash
npm install
npm run validate
npm run build
```

`npm run validate` adds real TypeScript project checks and Vitest suites for shared contracts, the Flavor Engine and the API. A browser-level Playwright suite is still a roadmap item.

## Packaging environment limitation

The archive was assembled in an environment where npm registry requests timed out. Therefore the following could not be executed here:

- a complete dependency installation;
- the real NestJS build;
- the real Next.js production build;
- the installed Vitest suite;
- browser E2E testing.

No partial lockfile, `node_modules` directory or generated build output is included. Create and commit `package-lock.json` after the first successful network-enabled `npm install`.

These checks are useful evidence, but they are not production certification. Run the complete commands above before deployment.
