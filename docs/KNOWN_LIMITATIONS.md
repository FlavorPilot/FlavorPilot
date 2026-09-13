# Known limitations — do not treat these as completed work

## Environment validation blockers

- Registry access returned DNS error EAI_AGAIN in this build environment. The complete install
  attempt timed out. No fresh verified package-lock.json was produced.
- Next/Nest builds, full dependency-aware typecheck, installed Vitest, React hydration and live
  browser E2E were not run here. The source can still contain dependency/version/type issues.
- Direct dependency pins come from the supplied project; this is not a claim that registry
  existence or the whole dependency tree was independently validated today.
- Supabase Auth, PostgreSQL SQL/migration, permissions, callbacks and Docker deployment need real
  staging tests. There is no live database, provider account, published domain or payment setup.

## CUL-001 — inherited aromatic warning gap

The source model penalizes 35 g rosemary in duck 220 g + cherry 70 g (quantity score falls),
but can fail to produce `dominantIngredient` for the rosemary. Its dominance function examines
the highest total-impact ingredient first, which can still be the duck. The old intended test
for that specific warning does not hold. One explicit TODO remains in kernel/Vitest tests.
No numeric coefficients were changed to hide this issue during a widget architecture task.

All 38 profiles, working ratios, pair adjustments and transformations remain unvalidated
hypotheses. Repeated calculations and passing regressions cannot establish sensory correctness.
Heuristic confidence can be high even when data is unreviewed. Model scores are not food-safety,
allergen, nutrition or cooking-temperature assurances. No medical guidance is provided by the UI.

## Product and technical gaps

- No real checkout, webhooks, Pro billing or user-selectable plan authority.
- No production AI until usage/rate quotas are implemented. No chat UI that pretends otherwise.
- No complete moderation, abuse prevention, analytics, backup/restore or load testing.
- Authenticated cloud save sources exist but must be tested with a configured provider.
- Guest drafts are stored separately from account drafts. Signing in does not silently upload
  guest content. Use explicit JSON export/import to transfer until a consent-based migration
  flow is implemented. Local recipes are device data, not confidential server-side storage.
- Corrupt browser data blocks overwriting rather than being silently deleted. Advanced recovery
  UI is not implemented; back up raw storage before manual repair.
- Public listing uses timestamp-only pagination, with equal-timestamp edge cases; account list
  is capped at 100 entries. Search ranking and full social functionality are not implemented.
- Update conflict protection catches overlapping server transactions, not stale clients that
  open a recipe hours earlier; add revision tokens/If-Match before multi-editor use.
- Unlisted token rotation/revocation independent of visibility is not implemented. Previously
  made copies of a published recipe cannot be withdrawn by this application.
- The browser imports the calculation code and starter catalogue. A private repository alone
  does not make code shipped to the browser secret. Model/IP protection needs an explicit design.

This is a complete source distribution for continued development, not a commercial-release
certification. Address these items through tests and measured acceptance, not completion percentages.
