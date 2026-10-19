# Ingredient input units — 2026-10-20

Grams remain the sole edible input mass for scoring, recommendations, USDA totals and AI's
server-recomputed analysis. This release does not change any scoring coefficient or model
version. Optional `DishItem.amount` records `{unit:'piece'|'ml',quantity,gramsPerUnit}` for
editing and display. Without it, the item remains a legacy gram input. New items and engine
recommendations retain their existing gram defaults; there is no rounding of recommendations
to whole pieces. Switching units preserves canonical grams exactly, including fractional pieces.

Editing a quantity multiplies it by the stored factor and rounds the resulting grams once to
0.001 g, matching database precision. Storing the factor prevents accumulated rounding drift
as a user types or edits repeatedly. An explicit edible-weight correction updates that factor
while retaining the entered count/volume. Later quantity edits scale the corrected weight.
Changing to grams removes the original-unit metadata; switching back uses the source reference
again. Invalid/non-finite/zero-rounded/over-5000-g quantities are rejected rather than clamped.
The API checks mass/quantity/factor consistency and verifies unit availability by ingredient;
the existing owner/visibility checks apply to saves. A corrected factor is a user measurement,
not authenticated catalogue evidence. Recipe text, preparation, ownership and entitlements
cannot be changed through unit metadata.

## Reference weights

References in `packages/flavor-engine/src/amounts.ts` are transcribed from USDA SR Legacy
2018-04 `food_portion.csv` (CC0), separately from sensory hypotheses. Portion/food IDs and the
original measure are retained. These are illustrative edible weights, not guaranteed sizes.
The selected reference is visible in the row; changing unit reveals an approximate gram total.
The edible-weight details explain size/density variation, shell/stone/discarded peel exclusion
and allow correcting the mass without losing the original quantity.

| Ingredient | Input unit | Source portion | Edible g | FDC ID / portion ID |
|---|---|---|---|---|
| Egg | piece | large | 50 | 171287 / 88374 |
| Garlic | piece | clove | 3 | 169230 / 84480 |
| Lime | piece | fruit, 2 inch diameter | 67 | 168155 / 82570 |
| Lemon | piece | fruit, 2⅛ inch diameter, without peel | 58 | 167746 / 81883 |
| Avocado | piece | generic Florida/California reference fruit | 201 | 171705 / 89226 |
| Onion | piece | medium, 2½ inch diameter | 110 | 170000 / 85860 |
| Tomato | piece | medium whole, 2⅗ inch diameter | 123 | 170457 / 86686 |
| Banana | piece | medium, 7–7⅞ inch, without peel | 118 | 173944 / 93515 |
| Milk | ml | 1 US fluid ounce | 30.5 | 171265 / 88315 |
| Olive oil | ml | 1 US cup | 216 | 171413 / 88668 |

Volume factors divide source mass by 29.57353 ml per US fl oz or 236.5882 ml per US cup,
from [NIST SP811 Appendix B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9).
US measures are an explicit approximation, distinct from a metric 240/250 ml culinary cup.
No universal 1 ml=1 g assumption or density inference from nutrient composition is used.
The generic milk/avocado references may differ from a particular product/variety; weigh it
when accuracy matters. Other foods remain grams until a reference is added. Spoons, cups,
pinches and cooking-loss/yield conversion are not supported. USDA portion documentation is at
[FoodData Central](https://fdc.nal.usda.gov/data-documentation/).

## Storage and rollout

Apply `20261019232430_ingredient_amount_units.sql` before deploying the matching API and web.
It adds nullable `input_unit`, `input_quantity`, `input_grams_per_unit` to existing dish items
with a bounded consistency check; no recipe rewrite, table grant, RLS, ownership or visibility
change. Fresh schema contains the same columns/check. The migration is repeatable. Rebuild
contracts, engine, API and web together. No catalogue seed regeneration is needed.

Original units survive scoped drafts, Undo/Redo, local saves, recipe JSON v1/v2 optional
fields, cloud create/read/update, version snapshots and remixes. Old recipes still load as
grams. Older clients can strip the optional metadata on an explicit item rewrite but retain
canonical grams; reload old tabs for unit-aware editing. Historical snapshots are not rewritten.
Rollback application code while retaining the additive nullable columns and saved quantities.
