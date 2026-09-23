# Development and test commands

Native Node 22.16+ (22.x) and npm 10 are the target. Setup preserves existing env files.
Use root workspace commands; do not flatten package.json files out of their directories.

| Command | Scope |
|---|---|
| npm run setup | copies missing environment examples only |
| npm run doctor | reports target Node and installed key dependencies |
| npm run dev | builds shared packages, watches both packages/API/web |
| npm run dev:web | builds packages, starts only Next |
| npm run dev:api | builds packages, starts only Nest |
| npm run check:widgets | static layer/import/public-API checks |
| npm run check:syntax | TypeScript parser diagnostics, not type resolution |
| npm run test:widgets | 16 pure editor/locale model runtime checks |
| npm run test:core | strict actual domain/kernel compilation + Node tests |
| npm run typecheck | shared build + actual workspace compiler checks |
| npm test | installed Vitest suites in all workspaces |
| npm run test:integration | Nest against a local `flavorpilot_test` Postgres. Refuses any other database |
| npm run test:e2e | Playwright critical path against that database, a local auth stub and `next dev` |
| npm run build | actual shared/API/Next production builds |
| npm run generate:seed | builds packages and emits reviewable SQL seed |
| npm run clean | removes generated outputs only |

A lockfile must be produced by a successful actual install, reviewed and committed. Until then,
CI has an explicitly warned bootstrap npm install branch. Once a lock exists CI uses npm ci.
Do not interpret that bootstrap branch as reproducible-release acceptance. Dependency audit
findings require triage; no automatic major upgrades or `--force` is part of the process.

Editing uses src, not dist. If there is a dependency error, record Node/npm, registry and actual
package versions, then reproduce in a native environment. Webpack is available as a diagnostic
alternative (`npm run dev:webpack --workspace @flavorpilot/web`); it is not proof that a browser
WebContainer supports all required native/runtime features.
