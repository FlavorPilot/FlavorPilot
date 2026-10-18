# Widget validation

Current results are in [VALIDATION.md](VALIDATION.md) and ../validation-report.json. Old r1 checks are not claimed as full application validation.

## Recipe preparation tabs 2026 10 18

Stages 1–2 of [the recipe workspace plan](RECIPE_WORKSPACE_PLAN.md) are implemented
in the working tree. Run on Windows using portable Node 22.23.3 and `scripts/npm.ps1`:

| Check | Result |
|---|---|
| `npm run validate` | Passed: structure and widget boundaries, 16 pure model/locale checks, 27 kernel checks, all workspace typechecks, 59 Vitest tests |
| `npm run build` | Passed: contracts, engine, Nest and Next production build, 23 generated static pages |
| `npm run test:e2e` | 13 passed, including both new preparation scenarios |
| `npm exec -- playwright test critical.spec.ts:192` | Existing API-outage scenario passed again in isolation |
| Production browser inspection | Ukrainian preparation tab rendered with description, servings, a step and the ingredient reference; no console errors |

The preparation E2E covers keyboard tab activation, typing groups in undo/redo,
step movement and removal, device save/reopen/reload, EN/UK switching without changing
authored text, invalid servings, mobile width and JSON v2 export/import. The export case
starts with an instruction-only draft, before any ingredients are added.

The full dev E2E run emitted a hydration warning in the existing API-outage/discover
scenario while components were being updated. That scenario passed without the warning
in the subsequent isolated run; the preparation test also asserted no page errors.
This does not establish that every unrelated hydration issue is resolved.

The first sandboxed production build reached static generation but failed creating a
standalone output directory with EPERM. The authorized build outside that restriction
passed; no framework or dependency changes were needed. The first E2E launch found an
older development API occupying port 4000; it was stopped before the successful run.

E2E used the disposable local PostgreSQL `flavorpilot_test` and an auth stub, not hosted
Supabase. The temporary preview server and test database were stopped after inspection.
No API/database migration, production AI, billing, push or deployment is part of this delivery.
Preparation steps and servings are available in browser drafts, local recipes and JSON v2;
cloud save of those fields is guarded until stage 3. Description uses the existing API field.

## Expanded catalogue and composition notes 2026 10 18

The final 620-food working tree passed `npm run validate` (67 Vitest, 27 kernel and 16
pure editor/locale tests plus typechecks/architecture), 9 local API/PostgreSQL integration
cases, the complete 15-case Playwright suite and a production Nest/Next build (23 static
pages). The two new browser cases check per-nutrient missing/covered rows, source links,
keyboard focus and Escape, touch, EN/UK and narrow-screen containment. Visual inspection used
the actual screenshot `.local/composition-breakdown-uk.png`. CSV comparison checked all 619
identities and 4,333 amount/missing-value pairs. Migration 0008 was tested locally twice and
preserved reviewed probes and private dishes. No hosted migration or deployment was run.
