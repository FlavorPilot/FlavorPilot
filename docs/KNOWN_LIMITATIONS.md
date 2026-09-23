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

## CUL-001 — range warning is separate from impact dominance

35 g rosemary with duck 220 g and cherry 70 g still lowers the quantity score. That row can
also be above its working maximum while duck remains the highest-impact ingredient, so
`dominantIngredient` is not the rosemary warning. The analysis now emits
`outsideRecommendedRange` for any ingredient whose gram share exceeds `share.max`. Impact
formula, dominance thresholds, and score coefficients are unchanged. The default dish still
has no range warning.

## Catalogue review coverage

The scoring catalogue is still 38 ingredients, 12 preparations and 64 explicit pair adjustments.
Those rows stay `unreviewed` hypotheses. A separate identity list cites 119 staple foods from
USDA FoodData Central (Foundation Foods CSV 2026-04-30 and SR Legacy CSV 2018-04), license
CC0 1.0. Each citation copies the USDA description, category and fdc id. Ukrainian labels are
project translations. Sensory profile, preparation effects, recommended range and pairing
evidence are empty, and the database rejects filling them on that table. A separate `nutrient-proxy-1` hypothesis maps published sodium, fat, sugars and water per
100 g onto four 0–10 axes and stays out of the dish score. Foods already in the transcribed 38 keep those composed profiles. The other
82 enter the score through `product-hypothesis-1`: composed values on all ten sensory axes, plus aroma, texture, role, share and preparation. They are the same kind of unreviewed product hypothesis as the original 38, not USDA measurements.
The dish assessment also shows a separate composition reference: protein, fat, carbohydrate, sugars, sodium and energy from the published USDA amounts, scaled by the grams in the dish. A missing amount stays out of that sum. It is not a laboratory result for the cooked dish and it does not change the model score. None of the 119 is `reviewed`. Pair adjustments are still empty for the 82. Rice vinegar has no row in those two releases, so it is not cited. Closed alpha
still aims for 80–120 reviewed core ingredients. Commercial 1.0 aims for 300–500 reviewed
ingredients. Neither target is met. Composed hypotheses do not count as reviewed coverage.

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
