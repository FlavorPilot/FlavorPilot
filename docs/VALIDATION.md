# Validation

## Dependency-free repository checks

Run:

```bash
npm run validate:structure
```

Current result: **30/30 checks passed**. The script verifies:

- required monorepo files and workspace declarations;
- valid JSON manifests;
- FlavorPilot package names and aligned workspace versions;
- npm-compatible local workspace dependency versions;
- absence of generated `dist`, `.next`, `node_modules` and `*.tsbuildinfo` artifacts;
- absence of product API routes inside Next.js;
- English and Ukrainian locale declarations;
- relative TypeScript import resolution;
- presence of Nest modules and server-side catalog validation;
- PostgreSQL privacy, publication and remix safeguards;
- example environment files contain no populated secrets.

## Full validation after installing dependencies

Run from a clean checkout:

```bash
npm install
npm run validate
npm run build
```

`npm run validate` adds TypeScript project checks and Vitest suites for shared contracts, the Flavor Engine and the API. Browser-level end-to-end coverage remains a roadmap item.

## Current limitation

The repository was prepared in an environment where npm registry requests timed out. A complete dependency installation, production build and installed test suite could not be executed during this commit.

No partial lockfile, `node_modules` directory or generated build output is committed. Run `npm install`, execute the commands above, then commit the generated `package-lock.json` after the first successful network-enabled installation.

The initial culinary data is still a product hypothesis rather than a production-validated scientific dataset. It must be independently reviewed, sourced and versioned before commercial claims are made.
