# Known limitations — do not treat these as completed work

## Restored composition scoring 0.5.1

The coverage-gated 0.5.0 replacement was rejected. All profile pairs again receive numerical
hypotheses, and the original overall/compatibility/balance/proportions/texture panel is restored.
The compatibility ceiling prevents high balance/proportions from concealing low compatibility.
It does not validate the underlying culinary profiles, 64 manual adjustments or working ranges,
infer consumed coating amounts, or calibrate scores against tasting data. See
[SCORING_REPAIR.md](SCORING_REPAIR.md). Null scores remain only in readable historical 0.5
reports. The first stage still cannot interpret a cooking workflow or final blending.

## Composition scoring 0.4.0

Count-dependent texture saturation is replaced by mass-weighted structural contrast, with
explicit purée replacing original texture tags. Contrast does not grade dish quality or enter
the composition index. The latter uses a harmonic mean of the existing compatibility/balance/
proportion hypotheses. See [SCORING_MODEL.md](SCORING_MODEL.md) for derivation and upgrade.
This does not validate those catalogue hypotheses, identify every incoherent dish, infer a
whole-dish blending step, or simulate milk/protein/acid chemistry. Professional tasting data
and recipe-format calibration are still missing. No empirically correct replacement score
for the incomplete sixteen-ingredient screenshot is claimed.

## Temporary AI test allowances

With AI_TEST_ACCESS_ENABLED, Free receives 100 units and guests 50. A guest is identified by
a random AI-only credential retained in the browser, with server-side accounting; this is not
proof of a unique person. Clearing browser storage or switching browsers can obtain another
identity, bounded by global session issuance and the shared monetary budget. Existing private
account routes remain protected. Test access has no automatic end date; the operator disables
the flag when testing ends. A disabled/re-enabled flag does not reset consumed test units.

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

The scoring catalogue has 620 ingredients, 12 preparations and 64 explicit pair adjustments.
Those rows stay `unreviewed` hypotheses. A separate identity list cites 619 foods from
USDA FoodData Central (Foundation Foods CSV 2026-04-30 and SR Legacy CSV 2018-04), license
CC0 1.0. Each citation copies the USDA description, category and fdc id. Ukrainian labels are
project translations. Sensory profile, preparation effects, recommended range and pairing
evidence are empty, and the database rejects filling them on that table. A separate `nutrient-proxy-1` hypothesis maps published sodium, fat, sugars and water per
100 g onto four 0–10 axes and stays out of the dish score. Foods already in the transcribed 38 keep those composed profiles. The other
82 retain `product-hypothesis-1`. A further 500 use `ai-product-hypothesis-2`: AI-authored culinary families, food-specific axes and refinements on all ten sensory dimensions, plus aroma, texture, role, share and preparation. These are hypotheses composed before release, not live AI inference or USDA taste measurements. See [CATALOGUE.md](CATALOGUE.md).
The dish assessment also shows a separate composition reference: protein, fat, carbohydrate, sugars, sodium and energy from the published USDA amounts, scaled by the grams in the dish. A missing amount stays out of that sum. Per-nutrient hover/focus/tap notes expose each row's contribution, missing data, reference state and source. Cooking losses, absorbed water, recipe yield and ingredient-specific preparation effects are not estimated. It is not a laboratory result for the cooked dish and it does not change the model score. None of the 619 is `reviewed`. Pair adjustments are still empty for the 582 additions; recommendations now search all 620 foods using the existing heuristic. Rice vinegar has no matching row in those two releases, so it is not cited. Closed alpha
still aims for 80–120 reviewed core ingredients. Commercial 1.0 aims for 300–500 reviewed
ingredients. Neither target is met. Composed hypotheses do not count as reviewed coverage.

All 620 profiles, working ratios, pair adjustments and transformations remain unvalidated
hypotheses. Repeated calculations and passing regressions cannot establish sensory correctness.
Heuristic confidence can be high even when data is unreviewed. Model scores are not food-safety,
allergen, nutrition or cooking-temperature assurances. No medical guidance is provided by the UI.

The recommendation search introduced in 0.3.1 simulates additions at catalogue minimum/ideal shares, ranks actual
model improvement and groups duplicate culinary roles/textures. Positive changes are model
outputs, not tasting evidence. The search checks two trial portions per food at its default
supported preparation; it does not find a continuous optimum, replacements, ingredient removals
or the best cooking method. It uses composition and goal, not recipe instructions, allergies,
dietary exclusions, pantry, cost or intended dish style. Culinary profiles and ranges remain
unreviewed; grouping is based on catalogue roles/textures rather than a learned dish taxonomy.

## Product and technical gaps

- No real checkout, webhooks, Pro billing or user-selectable plan authority.
- AI usage/rate quotas and a private recipe assistant are implemented; enabling a hosted pilot
  still requires the matching migration/deployment and a real provider smoke test. Billing and
  expert evaluation of culinary feedback remain outstanding. Unknown provider outcomes retain
  monetary reservations until operator reconciliation; there is no automatic reconciliation.
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
