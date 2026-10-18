# Development and test commands

Native Node 22.16+ (22.x) and npm 10 are the target. Setup preserves existing env files.
Use root workspace commands; do not flatten package.json files out of their directories.

## Windows desktop workspace

The primary local checkout is `D:\projects\FlavorPilot`. A portable official Node
22.23.3 / npm 10.9.9 distribution is installed in `.local/node-v22.23.3-win-x64`.
The system Node installation is unchanged. `.local/` is ignored by Git and contains
the runtime, npm cache, temporary files and Playwright browsers.

From PowerShell at the repository root, use the wrapper so child processes also
receive Node 22 and project-local cache/temp directories:

```powershell
.\scripts\npm.ps1 run doctor
.\scripts\npm.ps1 run dev
```

The wrapper accepts ordinary npm arguments; with no arguments it runs `npm run dev`.
It also works from another directory and restores the caller's directory and
environment when the command exits. On a new Windows checkout, install official
Node 22.16+ or extract its official `win-x64.zip` into `.local/`, then run:

```powershell
.\scripts\npm.ps1 ci --include=optional
.\scripts\npm.ps1 run setup
.\scripts\npm.ps1 exec -- playwright install chromium
```

The current untracked local configuration is:

- `apps/web/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:4000/v1`;
- `apps/api/.env`: `API_HOST=127.0.0.1`, `API_PORT=4000`, `AI_ENABLED=false`;
- the Supabase project URL and publishable key are configured in both env files.
  `GET /auth/v1/settings` returned 200 with that key. Real login, confirmation
  callbacks and password recovery still need end-to-end verification;
- `DATABASE_URL` is configured locally, but the direct database host is IPv6-only
  and this machine cannot reach IPv6. A Session pooler connection string is
  required before database access and the hosted schema can be checked. The
  guest editor, browser library and deterministic analysis remain available.

Local addresses: `http://localhost:3000/en`, `http://localhost:3000/uk`,
`http://localhost:4000/v1/health` and `http://localhost:4000/docs`.
Stop the development processes with Ctrl+C in their terminal.

### Database and browser tests on this machine

Docker Desktop currently fails during its Inference manager startup. As an
alternative, PostgreSQL 18.6 is installed from the official Ubuntu repository in
the existing `Ubuntu` WSL distribution. Its dedicated `18/flavorpilot` cluster
uses port `54329`, local authentication credentials `postgres` / `postgres`, and
the disposable database `flavorpilot_test`. The unused installer-created
`18/main` cluster is stopped. CI continues to use PostgreSQL 16; this local setup
does not change that configuration.

Keep the database running in its own terminal (foreground mode also keeps WSL
alive):

```powershell
wsl.exe -d Ubuntu -u root -- pg_ctlcluster --foreground 18 flavorpilot start
```

In another PowerShell terminal, run the suites in sequence:

```powershell
.\scripts\npm.ps1 run test:integration
.\scripts\npm.ps1 run test:e2e
```

The tests reset only a local database named `flavorpilot_test`. They use the
test-only authentication stub rather than hosted Supabase.
E2E starts and stops its own Next/API processes; keep ports 3000, 4000 and 54321
free before running it. It does not use the ordinary development `.env` secrets.
Stop the database when no longer needed:

```powershell
wsl.exe -d Ubuntu -u root -- pg_ctlcluster 18 flavorpilot stop
```

Both clusters use manual startup. No database needs to run when working only on
the guest editor or pure-model tests. The web app uses built-in CSS handling;
the empty PostCSS config was removed after reproducing a Turbopack worker crash
on Windows. No CSS plugins or framework versions were changed.

### Existing hosting

- [Vercel frontend project](https://vercel.com/nre6/flavor-pilot-web).
- [Railway API service](https://railway.com/project/45e97dd3-6e78-44e0-8b04-be4faf7b17e3/service/c043cf01-2497-438b-a087-4d2521ab4638?environmentId=ac6bc703-686c-4cc4-a975-445a4f8f0035).

These are authenticated dashboard links, not the public application/API URLs.
Local setup does not pull their secrets, apply hosted database migrations or
trigger a deployment. The configured Supabase Auth endpoint is reachable; its
database connection is awaiting an IPv4-compatible Session pooler string.

### Local verification — 2026-10-18

Executed on Windows x64 with Node 22.23.3 / npm 10.9.9 through `scripts/npm.ps1`:

- `ci --include=optional --no-audit --no-fund`: installed from the existing
  lockfile; `package-lock.json` was not changed.
- `run doctor` and `run check:syntax`: passed (144 TypeScript/TSX files parsed).
- `run validate`: passed, including 16 pure editor/locale checks, 27 kernel
  tests, all four workspace typechecks and 52 Vitest tests.
- `run build`: passed for contracts, engine, Nest and Next (23 static pages).
- `run test:integration`: 7 passed against PostgreSQL 18.6 in WSL.
- `run test:e2e`: 11 passed in Chromium against local Next/API, the disposable
  database and the test authentication stub.
- Initial `run dev` before Supabase configuration: both services and both package watchers started. EN/UK builder
  routes returned 200 with the correct `lang`; `/v1/health` reported
  `database: not_configured` as expected for the ordinary guest configuration.
  Posting the default composition to `/v1/flavor/analyze` returned 74 overall,
  61 balance and 313 g.

The initial Vitest run hit a Windows sandbox temp-file rename restriction;
project-local temp directories resolved it. The initial Next build failed in
the empty PostCSS worker configuration; removing that file resolved it. These
are local results, not verification of hosted Supabase or either deployment.

## Workspace commands

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
