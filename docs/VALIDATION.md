# Actual validation — widget-monorepo-r2

## Grounded composition review — 2026-10-18

The composition assistant now requests an ingredient/recipe-aware review with a verdict,
strengths, risks and priority actions containing instruction/reason/expected effect. Optional
additions must address a referenced risk and select a unique engine candidate; Nest attaches
the exact dose/preparation. Existing-ingredient advice and empty risk/action lists are valid.
Numerical prose, unknown references and provider-invented dose metadata are rejected. This
replaces score recitation for the opt-in UI, with legacy response compatibility. All labels
are EN/UK. Recipe text joins the existing consent/snapshot/hash path; advice stays read-only.

| Check | Result |
|---|---|
| `npm run validate` | Passed structure/boundaries, editor/kernel checks, workspace typechecks and 120 Vitest tests |
| Compiled API integration suite | 27 passed on isolated local PostgreSQL/Auth/provider stubs; includes recipe context, prepared profiles/pair evidence, no-change response, exact candidate doses, rejected numerical/unknown output, input-token rejection, refunds, cache and legacy responses |
| Assistant browser suite | 9 passed, including both composition locales, mobile width, no forced additions, metadata-only doses and unchanged editor composition |
| `npm run build` | Passed shared packages, Nest and Next production output, 27 generated pages |

Windows excluded the usual localhost:54329 test port. Checks used FLAVORPILOT_TEST_DATABASE_URL
on loopback 45429 with a temporary WSL stdio bridge to the same isolated flavorpilot_test
cluster; no PostgreSQL configuration, production database or machine port-proxy rule changed.
The existing supported Auth port override stayed 45421. No schema migration or new dependency.
Explanation input cap is 8000 tokens, output 2000 and charge 2 units; the same $5/day/$50/month
shared budget remains authoritative. The new prompt/cache version is culinary-review-6.
These local checks establish behavior and accounting, not culinary accuracy; hosted output
inspection is recorded separately after rollout.

## Temporary Free/guest AI access — 2026-10-18

Free accounts receive 100 test units; guests receive 50 with a server-issued AI-only browser
credential. AI_TEST_ACCESS_ENABLED controls the rollout independently from paid subscriptions
and owner pilot grants. Test usage is separate from calendar refills and retained when the flag
is toggled. The shared monetary budgets, request limits, cache and uncertain-cost accounting apply.

| Check | Result |
|---|---|
| `npm run validate` | Passed: structure/layer checks, editor/kernel checks, all workspace typechecks, 114 Vitest tests |
| Compiled API integration suite | 26 passed on disposable local PostgreSQL/Auth/provider stubs; tests 100/50, refund, concurrent exhaustion, calendar boundaries, toggle persistence, paid/pilot priority, denied private routes, invalid bearer, hashed credentials, issuance bounds and repeatable migration |
| Focused assistant browser suite | 7 passed; includes guest use without signup, consent, persisted identity/balance after reload and the Free 100-unit display |
| `npm run build` | Passed shared packages, Nest and Next production output, 27 generated pages |
| Hosted Supabase | Migration applied; guest/ledger/cache tables have RLS and deny SELECT to anon/authenticated; XOR account/guest constraint verified |
| Hosted inference | One real Luna guest step review returned 201 and one comment; 50 became 49, identical replay was cached with no further unit, fresh capabilities retained 49, account capabilities returned 401 |

Implementation 0677b80 and documentation fa1871b reached Vercel READY. Railway test-mode rollout
48041c9e-c791-45bc-9174-fe7266e3b6af reached SUCCESS and public capabilities report guest_test/50.
The security advisor has ten intentional closed-table
[RLS/no-policy informational findings](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
(one new guest table), and the existing
[leaked-password protection warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
No new security error/warning was introduced. Browser identity is not proof of a unique person;
see KNOWN_LIMITATIONS. These checks verify implementation, not culinary prediction accuracy.

## Finished-dish forecast and recipe generation — 2026-10-18

Full review now optionally returns a qualitative dish verdict, expected taste/texture, strengths,
risks, specific cooking actions with reasons and assumptions. It also accepts compositions
without steps. Legacy full-review responses retain their previous shape. A separate generator
creates a preview from selected ingredients/grams/preparations, preserves servings and validates
ingredient-ID coverage. Explicit confirmation applies text in one undoable operation, preserving
composition and cloud identity. A full assessment survives later step reviews. All new UI copy
has EN/UK entries, including stale, error, preview, confirmation and qualitative verdict labels.

| Check | Result |
|---|---|
| `npm run validate` | Passed: structure/boundaries, 16 pure editor/locale checks, 27 kernel checks, all workspace typechecks and 110 Vitest tests |
| `npm run test:integration` | 24 passed with disposable PostgreSQL/Auth/provider stubs, including repeatable migration, empty-step forecast, generation ID/servings validation, exact accounting and cache |
| Final compiled API check | `node --test apps/api/test/dishes.integration.mjs`: 24 passed after production build, including denial of generation against another account's existing private dish |
| `npm run test:e2e` | Full browser run: 30 passed, one new undo assertion used an unsuitable exact label selector; page snapshot showed the correct restored description |
| Focused assistant rerun | All five cases passed after fixing the selector; also checks forecast persistence across step review, explicit apply/cancel/Undo, unchanged composition, mobile confirmation and stale/error preservation |
| `npm run build` | Passed: shared workspaces, Nest API and Next production output |
| Visual inspection | Actual component captures `.local/ai-outcome-en.png` and `.local/ai-generation-uk-mobile.png`; readable forecast, cooking advice and Ukrainian preview/action at 375 px |
| Evaluation dry-run | Three full-review cases now request outcome; maximum remains 12 units / $0.0096, with no provider call from the dry-run |

The first browser launch was refused because Windows reserved port 55421; the test run used
the supported FLAVORPILOT_E2E_AUTH_PORT override to free port 45421. No production Auth setting
was changed. The small production migration expands only the ledger feature constraint to
`generate`, preserving existing rows, grants and RLS. Hosted inference of the new response
formats remains a separate rollout check; these local stubs do not establish culinary quality.

Implementation `3f91a75` reached Vercel READY and Railway SUCCESS
(`58fff460-dfa0-4050-b89c-48b077a01903`); hosted checks returned a full outcome with three cooking
actions, a four-step generated recipe, and an identical cached generation without extra units.
The generator preserved all selected ingredient IDs and two servings. Inspection found that
the full outcome followed the Russian input language despite locale uk, while generation was
Ukrainian. Strengthened native-language developer instructions and added a narrow rejection
rule for Russian-only letters in Ukrainian output. It is not a general language detector.
This rejects rather than silently translates/retries a bad response; known provider cost stays
recorded, while user units are returned. Prompt version advanced to culinary-review-3 to avoid
old cached responses. API typecheck, 28 unit tests, production API build and all 24 integration
cases passed, including the invalid-language refund path. Hosted language retest is pending.
That retest was rejected as AI_RESPONSE_INVALID; its provider cost remained recorded and its
user units were zero. Tightened output processing to allow exact quoted source wording inside
Ukrainian prose and assign service-owned comment/step UUIDs before contract parsing. Cached
results keep those UUIDs stable. Logs report only a fixed rejection reason/section, never the
response text. Prompt version is now culinary-review-4. The final API typecheck, 29 unit tests,
production API build and all 24 integration cases passed, including arbitrary provider IDs,
stable cached IDs, quoted-source handling and rejected-language accounting.

Final implementation `8273b60` reached Railway SUCCESS
(`27bed0e4-cc39-4f27-b368-b5694415b1a4`) and Vercel READY. The same Russian-input/uk-locale
synthetic dish then returned 201 with Ukrainian comments, verdict, taste/texture, strengths,
risks and three cooking actions; the actual output was inspected. Its ledger row recorded
4 units, 1002 input / 1114 output tokens and 658 micro USD. Earlier successful generation was
4 steps / 4 units / 313 micro USD, with the cached repeat retaining identical text and IDs.
Final `npm run validate` passed all workspace checks and 113 Vitest tests. The API's final
integration run remains 24 passed; frontend/browser source is unchanged from the five-case
passing assistant rerun and the successful full production build.

The production constraint verification includes generate; both AI tables retain RLS, and anon/
authenticated reads remain denied. Security advisors were unchanged before/after this migration:
nine intentional [closed-table notices](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
and the existing [password-protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
No auth configuration, model coefficients, paid billing flow or broader pilot access changed.

## Hosted GPT-6 Luna smoke passed — 2026-10-18

After the operator replaced OPENAI_API_KEY in Railway, deployment
`4a1c7874-283d-4470-b6d4-408572c64fd1` reached SUCCESS on implementation `c452aef`.
The authenticated production pilot returned real Ukrainian results for all three features:
composition explanation (201, three actions), full recipe review (201, two comments) and
active-step review (201, two comments attached only to the active step). The synthetic recipe
deliberately served fish before cooking; both reviews identified that sequence inconsistency.
Responses were inspected as text. This is a functional smoke, not expert culinary validation.

Repeating the identical full-review request ID returned 201 without consuming additional
quota. The owner-scoped database check found exactly three successful generation rows:
explain 2 units / 785 input / 437 output / 297 micro USD; full 4 / 509 / 292 / 197;
step 1 / 532 / 272 / 190. Total: 7 units, 1,826 input and 1,001 output tokens,
684 micro USD recorded cost (rounded up per request), zero reasoning tokens. Final pilot
quota was 293/month and 23/day. The earlier access failures below are historical; no secret
values or actual private recipes were exported, committed or used in these synthetic checks.
Owner-only pilot and application budgets remain in place. Broader evals, expert review,
unknown-charge reconciliation and real paid-plan billing remain separate outstanding work.

## Provider project diagnostics — 2026-10-18

The operator supplied a dashboard screenshot with GPT-6 Luna allowed, while hosted requests
still returned 403 model_not_found. Added extraction of a bounded project ID from the known
access-denial message and a validated x-request-id header, without logging raw provider
messages. API typecheck, 26 API tests and the production API build passed; redaction tests
reject arbitrary IDs, line breaks and sensitive provider-message content. This enables project
matching; the screenshot alone does not establish which project owns the deployed key.

## GPT-6 Luna migration — 2026-10-18

The operator explicitly requested `gpt-6-luna` after the previous model's access rejection.
Verified the [official model](https://developers.openai.com/api/docs/models/gpt-6-luna),
pricing and Responses compatibility. Retained reasoning none, JSON schemas, token/unit limits,
consent and owner-only pilot. Updated active model defaults, eval metadata and micro-USD prices
to Standard short-context input $0.10/M and output $0.50/M. A full review reserves $0.0032.
Requests force default service tier and explicit caching without breakpoints to avoid Fast
pricing and GPT-6 implicit cache-write premiums. The public model ID has no dated snapshot in
current documentation; future provider changes require renewed evaluation.

API typecheck, all 25 API unit tests and API production build passed. The first integration
attempt could not connect after WSL stopped its background database. With a live isolated
WSL database, `node --test apps/api/test/dishes.integration.mjs` passed all 23 cases, including
Luna request parameters and exact ledger reservation/settlement amounts. Eval dry-run reports
12 units / $0.0096 maximum for three cases. Published migration commit `225032f`: Vercel READY,
Railway deployment `69217af2-f42c-4cf0-b9cf-f588c3426f24` SUCCESS with the owner-only pilot
enabled. Hosted capabilities report pilot/300 monthly units. Both synthetic Luna attempts
(explanation and full review) were rejected by OpenAI generation with HTTP 403 model_not_found;
token preflight passed. Ledger rows correctly retain model `gpt-6-luna`, reservations 1300/3200
micro USD, failed status, zero consumed units and zero recorded charges. The operator must
verify model access and API billing in the key's project. Successful Luna inference and hosted
cache/step review remain unverified. No repeated paid requests are scheduled.

## Hosted culinary assistant activation — 2026-10-18

Published implementation commit `ee15b43`: Vercel production reached READY and Railway API
reached SUCCESS. After the operator saved OPENAI_API_KEY directly in Railway, enabled the
requested owner-only pilot with the pinned model and $5/day, $50/month application budgets.
Deployment `61b8e8da-337e-43e3-ba82-d5fec343d4c8` reached SUCCESS; authenticated capabilities
returned enabled=true, access=pilot, 300 monthly units. Two synthetic hosted requests
(explanation and full recipe review) returned 502 AI_PROVIDER_UNAVAILABLE. Both ledger rows
were failed with zero units and zero charged micro USD; no usable GPT result was obtained.

Added safe provider diagnostics: only HTTP status, stage and fixed allowlisted error/parameter
labels enter server logs. Raw error messages, credentials and recipe content are excluded.
API typecheck and all 24 API unit tests passed, including two diagnostic redaction tests.
The API production build also passed. Diagnostic commit `1ea5013` reached Railway SUCCESS
(deployment `837abaae-1580-41b7-add3-15ee39649a25`) and Vercel READY. One additional synthetic
explanation request confirmed that input-token preflight passes, but generation is rejected
by OpenAI with HTTP 403, code `model_not_found`, no missing-scope marker. The configured
`gpt-5.4-mini-2026-03-17` snapshot is listed in the official model documentation; access for
the key's project still needs verification by its owner. All three hosted attempts are failed,
with zero user units and zero recorded charges. No fallback model was substituted. Successful
provider inference, hosted cache/idempotency smoke and expert review remain unverified.

## Cloud preparation and budgeted culinary assistant — 2026-10-18

Implemented cloud servings/ordered steps, optimistic version checks, preserved versions/remixes,
and an additive repeatable migration. Added authenticated explanation/step/full review through
one database-backed quota/budget service, explicit pilot grants, exact input-token preflight,
bounded structured output, private cache, idempotency and conservative uncertain-charge holds.
The editor requires consent, preserves drafts on failure, supports optional delayed comments
and prevents applying stale suggestions. EN/UK strings, quota reset times and CRM usage metrics
are present. Numerical Flavor Engine scores and catalogue coefficients are unchanged.

| Check | Result |
|---|---|
| `npm run validate` | Passed: 130 frontend files/boundaries, 16 pure editor/locale checks, 27 kernel checks, workspace typechecks and 104 Vitest tests |
| `npm run build` | Final sequential run passed: shared packages, Nest and Next production output with 27 generated static pages |
| `npm run test:integration` | 23 passed on disposable PostgreSQL with Auth/provider stubs; includes concurrent reservations, budget/quota rejection, expired subscription, cache/idempotency, excessive input, invalid step reference, incomplete/unknown responses, cloud round-trip, stale writes and repeatable migration |
| Final compiled API check | `node --test apps/api/test/dishes.integration.mjs`: 23 passed after the final production build |
| `npm run test:e2e` | Full run: 28 passed; the new cloud test searched device storage instead of selecting account storage and failed. Selector corrected; all three assistant cases passed on rerun |
| `npm run test:e2e -- tests/e2e/culinary-assistant.spec.ts` | Final focused run: 3 passed, including cloud reload, explicit apply/undo, stale rejection, automatic edit trigger, consent and UK 375 px error layout |
| Visual inspection | `.local/ai-review-en.png`, `.local/ai-review-uk-mobile.png`; fixed comment-card flex layout after inspecting the first screenshots |
| `node scripts/evaluate-ai.mjs` | Dry-run passed: three selected synthetic cases, at most 12 check units / $0.081 provider reservation; no paid request sent |

Initial integration execution was blocked by sandbox TCP permissions; rerun used the isolated
test database with approved network access. Tests caught PATCH defaults clearing omitted fields,
SQL date serialization and reserved SQL aliases; corrected before the passing runs. An overlapping
Nest build/E2E start was discarded and subsequent builds ran sequentially. Windows standalone
output needed approved filesystem access. No mock response is evidence of culinary accuracy.

The provider key was found in Vercel as Sensitive; a single-variable read could not return its
value. A proposed bulk production-env export was rejected by automatic approval review and was
not executed. The narrower metadata/single-key API read did not export other secrets. The API
Railway service lacked OPENAI_API_KEY at inspection time; its value must be set by the owner.
The operator subsequently authorized the production migration, main push/deployment and an
owner-only pilot. The additive migration was applied to the active Supabase project: steps
exist, AI tables enable RLS and anon/authenticated cannot read the ledger/cache. The security
advisor reports the two expected additional closed tables ([deny-all RLS notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy));
the existing [leaked-password protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
was unchanged. At this pre-publication checkpoint, Railway still did not list OPENAI_API_KEY;
pilot activation, actual provider inference and expert review remained pending. Later hosted
deployment results must be recorded separately from these local/stub validation results.

## Hosted database and owner bootstrap — 2026-10-18

With explicit operator authorization, initialized the empty active Supabase project's public
schema and all four catalogue seeds. Verified 620 ingredients, 12 preparations and 619 identity
and nutrient records, with RLS enabled on all 18 public tables. Provisioned the requested team
Auth account and an audited active owner membership. Initialized missing profiles and default
free subscriptions for two pre-existing Auth users; existing profile records were preserved.

Applied `20261018122502_harden_trigger_function_permissions.sql`: fixed helper search paths
and revoked direct execution of internal trigger functions. Advisor function warnings were
resolved; seven intentional deny-all RLS tables have no direct-client policies. Auth leaked
password protection remains a separate operator setting, unchanged by this bootstrap.

Reset the database password to the operator's requested value through the Management API,
verified a native PostgreSQL connection, then switched the Railway API and ignored local API
environment to the verified TLS session pooler. Passwords and API keys are absent from source.
Railway deployment `5ffa6b22-5e9f-4527-b17c-e7f7bdbcb940` reached SUCCESS.

| Check | Result |
|---|---|
| `npm run test:integration` | 21 passed, including repeatable trigger hardening, denied direct execution and working signup; disposable test database stopped afterward |
| Hosted `/v1/health` | 200, database connected |
| Requested account password sign-in | Passed against Supabase |
| Hosted `/v1/admin/access` | 200, owner, MFA required and not yet verified |
| Hosted `/v1/admin/overview` before MFA | 403 `ADMIN_MFA_REQUIRED` |
| Hosted `/v1/dishes/me` | 200, empty own library |
| Anonymous `/v1/admin/access` | 401 |

The owner must enroll/challenge their own authenticator in the CRM. Hosted MFA completion,
email delivery and the entire browser suite were not tested in this bootstrap. No frontend
deployment or Git push was performed.

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
