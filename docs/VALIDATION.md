# Actual validation — widget-monorepo-r2

## Executed successfully

| Check | Evidence |
|---|---|
| Complete source/workspace boundaries | 4 workspaces, 18 required paths, 108 relative imports |
| Widget architecture | 90 frontend TypeScript/TSX files, 11 widget slices |
| TypeScript syntax | 135 files, no parser errors |
| Pure editor and localization runtime | 16 checks passed |
| Pure kernel strict compilation | Real domain/engine/catalog source, available TS 5.8.3 |
| Kernel runtime | 21 passed, 0 failed, **1 known TODO (CUL-001)** |
| Static CSS render | 10 viewport/locale combinations; no document-width overflow |

The project pins TypeScript 5.9.2, but only global 5.8.3 was available in this environment.
The kernel check uses real source and emitted JavaScript, not third-party type shims. The
separate widget check runs pure reducer/locale code in an isolated JS context. Neither proves
the correctness of React hooks, Next routes, Nest integration, Zod/Drizzle versions or PostgreSQL.

The visual harness uses inert hooks and a small JSX-to-HTML serializer. It displays **actual
experimental kernel output**, but cannot execute application buttons or network requests.
The resulting HTML/screenshots are layout previews, not an interactive deployed prototype.

## Repository check — 2026-09-23

`npm ci --include=optional`, `npm run validate` and `npm run build` passed on Node 24.21.0 /
npm 11.19.0. The structure check also passed with `apps/web/.next` absent. Node 22 and staging
Supabase were not part of that pass. Current evidence is `repositoryVerification` in
[validation-report.json](../validation-report.json).

On the same day, `npm run test:integration` passed 4 Nest cases against a local
`flavorpilot_test` Postgres, and `npx playwright test` passed 9 browser cases against that
database plus a local auth stub. CI runs the same commands on Node 22. The stub confirms
accounts immediately, so this is not a staging email-confirmation pass.

## Historical archive record

The checks below describe the 2026-09-05 source archive, not the repository check above.

Full npm install did not finish within the tool's 20-second deadline. A subsequent real registry
diagnostic returned `EAI_AGAIN registry.npmjs.org`. That archive therefore did not claim a
complete dependency tree, verified lockfile, installed typecheck/Vitest, Next build or Nest build.
No database, auth-provider, migration, live E2E, Docker or deployment test was executed.

Commands and outputs: `../validation-report.json` and `validation/*.log`.
CUL-001 is intentionally left as TODO; it is not counted as a passing test. See
[KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) for the reproducible aromatic warning gap.

## Required next verification

On native Node 22, install dependencies successfully, commit the actual lockfile, run
`npm run validate` and `npm run build`, then execute `docs/ACCEPTANCE.md` with real staging users.
Adding more source files or passing static scans does not replace this gate.
