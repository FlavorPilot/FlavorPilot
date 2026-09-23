# FlavorPilot — widget-monorepo-r2

Complete source distribution; technical alpha. Internal packages retain version 0.3.0.
Source baselines and intentional changes: docs/SOURCE_AUDIT.md.

Implemented in source: a layered widget frontend, editor/history/preview/autosave, EN/UK,
local/cloud adapters and auth forms; Nest authenticated CRUD, deterministic analysis and optional
AI wrapper; shared schemas; Supabase fresh schema and an explicit hardening migration.

Proved on 2026-09-23 against parent `ad95487`: `npm ci --include=optional`, `npm run validate`
and `npm run build` completed. The committed lockfile was used and not regenerated. Evidence is
in validation-report.json. The local runtime was Node 24.21.0 / npm 11.19.0, so this is not a
Node 22 certification; CI remains the Node 22 check. CUL-001 is a range warning, separate
from impact dominance. The scoring catalogue remains 38 unreviewed ingredients. 119 USDA identity citations are stored separately, with empty sensory fields and no review.
`nutrient-proxy-1` hypotheses cover saltiness, fat, sweetness and moisture only where USDA
publishes the nutrient. 82 foods outside the transcribed 38 now enter the score on those axes.

Not proved here: live UI interaction, Supabase Auth, PostgreSQL, two-user permissions, browser
E2E, Docker or deployment. Changes reach main only through a pull request.

Next gate: green CI on Node 22, then staging Supabase and docs/ACCEPTANCE.md.
No percentages, fake users, payment success or production-readiness badge are justified yet.
