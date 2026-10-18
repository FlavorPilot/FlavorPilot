# Actual validation — widget-monorepo-r2

## Auth error diagnosis and localization — 2026-10-18

Hosted Auth logs distinguish `invalid_credentials` on password sign-in from
`over_email_send_rate_limit` (429) on recovery. Signup 200 responses do not establish another
email delivery. No account password, confirmation flag or mail quota was changed for this fix.
An attempted private account-state read was rejected by automatic approval review and was not
retried; the diagnosis uses restricted service-log fields rather than private account records.

The authentication feature now maps known provider codes to EN/UK messages without displaying
raw provider text. Unknown errors remain generic. Email limits, unconfirmed email, password
validation, expired sessions, connectivity and server failures are separate messages. Inputs
survive failures, and a failed reset request never displays a success notice.

| Check | Result |
|---|---|
| `npm run validate` | Passed: 125 frontend files/boundaries, 16 pure editor/locale checks, 27 kernel checks, all workspace typechecks and 99 Vitest tests |
| `npm run test:e2e -- tests/e2e/auth-errors.spec.ts` | Final run: all three new cases passed, including Ukrainian 375 px layout and explicit retry |
| `npm run build` | Passed: shared packages, Nest, Next production build with 27 generated static pages |

Initial browser assertions matched both the form alert and Next's route announcer; selectors
were scoped to the authentication region and the complete three-case file rerun successfully.
Browser errors were intercepted locally: no hosted signup, password change or email was sent.
The disposable local database was stopped afterward. Full browser and API integration suites
were not rerun. UI changes are local source changes, not a Vercel deployment. Custom SMTP and
an end-to-end hosted confirmation/recovery test remain outstanding; see [DEPLOYMENT.md](DEPLOYMENT.md).

## Composition-specific recommendations — 2026-10-18

Model 0.3.1 changes recommendation selection/portions/explanations; the primary assessment
coefficients and catalogue profiles are unchanged. Verified on native Node 22.23.3 / TS 5.9.2:

| Check | Result |
|---|---|
| `npm run validate` | Passed: structure/boundaries, 16 pure editor/locale checks, 27 kernel checks, all workspace typechecks, 86 Vitest tests |
| `npm run check:syntax` | 202 source files, zero parser errors |
| `npm run test:e2e -- tests/e2e/recommendations.spec.ts` | Both new browser cases passed; recalculation, exact preview/Apply, unchanged original, UK keyboard details and 375 px containment |
| `npm run build` | Passed: contracts, engine, Nest, Next production output with 27 generated static pages |

The five new engine tests cover all ten goals, exact displayed deltas/profile changes,
working share limits, preparation/direction/proportion sensitivity, scalable doses without
the old 180 g recommendation ceiling, duplicate role/texture suppression and empty/full
compositions. Existing default-dish scores remain 74 overall / 61 balance at 313 g.
The first build attempt exited during `tsc` without compiler diagnostics; the sequential retry
completed successfully. Logs are ignored under `.local/recommendations-*`.
The focused browser suite used disposable local PostgreSQL and the auth stub; the database
was stopped afterward. The complete browser and API integration suites were not rerun for
this change. No hosted migration, push or deployment was performed. These checks establish
determinism and UI behavior, not sensory accuracy or an external AI inference capability.

## Administration and support — 2026-10-18

The first CRM implementation adds server-assigned owner access, MFA gating, eight operator
sections, distribution moderation, consent-based feedback review and private support threads.
Verification uses native Windows Node 22.23.3 / TypeScript 5.9.2:

| Check | Result |
|---|---|
| `npm run validate` | Passed: structure/widget boundaries (123 frontend files), 16 pure editor/locale checks, 27 kernel checks, all workspace typechecks and 81 Vitest tests |
| `npm run check:syntax` | Passed: 200 source files, no parser errors |
| `npm run test:integration` | Final run: 20 passed on disposable local PostgreSQL 18.6 with auth stub, including operator CLI bootstrap and repeatable migration 0010 |
| `npm run test:e2e` | Final complete run: 21 passed in 1.5 minutes, including all three new CRM/support cases |
| `npm run build` | Passed: contracts, engine, Nest and Next production build; 27 generated static pages including EN/UK admin and support |
| Browser inspection | `.local/admin-overview-en.png`, `.local/admin-catalogue-uk-mobile.png`, `.local/support-conversation-en.png`; mobile containment checked at 375 px |

The local auth stub uses opaque tokens and explicitly disables MFA. Tests separately exercise
remote-verification failure, matched assurance claims, server MFA denial, production refusal
to disable MFA and immediate owner revocation. A real Supabase TOTP enrollment/challenge and
refresh still requires staging verification; these local results do not prove that integration.

Browser startup first hit Windows EACCES on reserved auth port 55421; the run used the existing
override with port 45421. A test-only MJS/CommonJS import and ambiguous avocado/alert selectors
were corrected. Visual review found a percentage display scaled twice; it was corrected and
the final browser run checks avocado's 8 / 18 / 34 percent shares. No model coefficient changed.
Earlier focused CRM run: all three passed, followed by the final complete 21-case run.

Integration covers closed-by-default old feedback, author withdrawal and ownership, stale
review/moderation/support writes, distribution bypasses, support response-loss retries,
creation limits, role denial and migration reapplication. No hosted migration, owner grant,
push or deployment was performed. See [ADMINISTRATION.md](ADMINISTRATION.md) for actual scope.
The temporary local test database was stopped after the runs.

## Model feedback and public comments — 2026-10-18

Implemented private, versioned prediction feedback and discussion on public cloud recipes.
Executed locally on Windows with portable Node 22.23.3 and TypeScript 5.9.2:

| Check | Result |
|---|---|
| `npm run validate` | Passed: structure/widget boundaries, 16 pure editor/locale checks, 27 kernel checks, all workspace typechecks, 74 Vitest tests |
| `npm run check:syntax` | Passed: 170 source files, no parser errors |
| `npm run test:integration` | 13 passed against disposable local PostgreSQL 18.6 and auth stub; migration 0009 applied twice |
| `npm run build` | Passed: contracts, engine, Nest and Next production build; 23 generated static pages |
| Playwright | Existing 15 scenarios passed in the full run; after form-label/selector fixes, all 3 new feedback/discussion scenarios passed together in the final focused run |
| Visual inspection | Actual browser screenshots `.local/model-feedback-en.png` and `.local/discussion-uk.png`; Ukrainian discussion at 375 px has no horizontal overflow |

The initial E2E launch found the normal API port occupied. Tests now use dedicated ports and
an ignored `.next-e2e` output directory, leaving the development server alone. The first full
18-case run passed 17 cases; one new case exposed an ambiguous alert selector and then a
textarea-label association issue. Both forms now use explicit label/control IDs; the final
focused run passed all three new cases. This is not a claim of a final single 18/18 run.

Integration covers private ownership, server recomputation, immutable source/version snapshots,
before/after-cooking separation, comment permissions, visibility changes, preserved replies,
cursor ties, revoked direct-role access and repeatable migration. Browser tests also cover
failed submissions without losing text, stale-version refresh, escaped user text and EN/UK.
These tests use a local auth stub, not hosted Supabase. No hosted migration, push or deployment
was performed. Feedback does not automatically train or change scores. See [FEEDBACK.md](FEEDBACK.md).

## Catalogue and composition notes — 2026-10-18

Final working-tree catalogue: 620 ingredients, including 500 new AI-authored hypotheses,
619 USDA identity/nutrient rows; original 120 sensory profiles and original 119 source rows
preserved. Executed with native Windows Node 22.23.3 and TypeScript 5.9.2:

| Check | Result |
|---|---|
| `npm run validate` | Passed: boundaries/structure, 16 pure editor/locale checks, 27 kernel checks, all workspace typechecks, 67 Vitest tests |
| `node scripts/verify-fdc-catalogue.mjs` | 619 exact descriptions and 4,333 nutrient/missing-value pairs match official CSV |
| `npm run test:integration` | 9 passed against disposable local PostgreSQL 18.6 and auth stub; new foods save through API; migration 0008 applied twice and preserves reviewed probes/private recipes |
| `npm run test:e2e` | Full final run: 15 passed, including mouse/keyboard/touch notes, Ukrainian catalogue, 375 px containment and existing auth/save/recipe scenarios |
| `npm run build` | Passed: contracts, engine, Nest and Next production build, 23 static pages |
| Visual inspection | Actual browser screenshot `.local/composition-breakdown-uk.png`; readable mobile nutrient breakdown with sources and no horizontal overflow |

The first browser run exposed ambiguous test selectors after the catalogue grew (Duck/Duck
liver and two comboboxes); selectors were scoped to exact foods/labels. The final full run
passes all cases. Initial sandboxed integration could not connect to localhost (EACCES); the
same suite passed outside that network restriction. These are local tests with a stub auth
service, not hosted Supabase or production-service validation. The test database was stopped.
No hosted migration, push or deployment was performed. See [CATALOGUE.md](CATALOGUE.md).

## Earlier archive validation record

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
accounts immediately, so this is not a staging email-confirmation pass. A later local run of
the same suite is 5 cases: the fifth checks that seeded catalogue rows stay unreviewed and
that PostgreSQL rejects `reviewed` without a reviewer, source and review time.

619 USDA FoodData Central identity citations are in the knowledge catalogue. They are CC0
records of food identity, not reviewed sensory profiles. `nutrient-proxy-1` adds unreviewed hypotheses for saltiness, fat, sweetness and moisture and does not feed the dish score.
82 foods outside the transcribed 38 retain composed `product-hypothesis-1` profiles; 500 further foods use AI-authored `ai-product-hypothesis-2`. The transcribed
38 profiles are unchanged. A separate composition reference sums published USDA protein, fat, carbohydrate, sugars, sodium and energy by dish grams and does not change those scores.

The 2026-10-18 expansion source check compared all 619 descriptions and 4,333 nutrient/missing
amount pairs against the downloaded official CSV releases. The original 119 identity and
nutrient records are byte-equivalent as parsed objects. This establishes transcription, not
sensory correctness. See [CATALOGUE.md](CATALOGUE.md) for source hashes and regeneration.

CUL-001 is no longer a TODO. The kernel check for this change is 27 passed, 0 failed, 0 todo.
Excess rosemary emits `outsideRecommendedRange` while duck can remain the dominant-impact
ingredient. Catalogue provenance is stored separately, and the current 38 ingredients stay
unreviewed. The closed-alpha target of 80–120 reviewed ingredients and the 1.0 target of
300–500 are not counts in this repository.

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
