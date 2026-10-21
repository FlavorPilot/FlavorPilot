# Ingredient-stage assessment — model 0.5.0-hypothesis

Historical, rejected replacement. Current scoring and the original assessment panel are
restored in [SCORING_REPAIR.md](SCORING_REPAIR.md), version 0.5.1-hypothesis. The full-coverage
gate, unscored profile pairs and substitution of coverage for proportions below no longer apply.

Composition is an ingredient workspace. It does not infer coating, marinade, serving groups,
final blending or a cooking workflow. Finished-dish forecasting stays in the recipe stage.
This release changes assessment semantics, not source sensory profiles, explicit adjustments,
nutrients, unit references, entitlements or provider budgets. No professional calibration is claimed.

## Unknown is not a score

A pair has a hypothesis only if its key is present in `explicitPairAdjustments`. A zero-valued
entry is an explicit neutral hypothesis; absence is unknown. The current 64 authored rules
remain unreviewed. Unknown pairs return `score:null`, `evidence:unknown`, `signal:unknown`.
Generic aroma similarity/complement coefficients no longer invent a score for them.
Known pairs retain the historic formula, with `evidence:hypothesis` and a support/neutral/
potentialConflict signal from the sign of the explicit adjustment. A negative rule is a
conditional catalogue concern, not an established defect or food-safety verdict.

`compatibilityScore` is the weighted mean of assessed pairs only, or null if none exist.
Pair weights remain sqrt(ingredient impacts), with the historic gram/intensity impact formula.
Adding unknown pairs does not dilute or improve the assessed subset. `overallScore` is this
same compatibility mean only when **every pair** has an explicit hypothesis; otherwise null.
The complete-coverage rule needs no invented percentage threshold. Full coverage is not
scientific validation. Even a fully covered two-ingredient index is an authored hypothesis.

`ingredientAssessment` supplies status (insufficient/partial/complete), assessed/total counts,
weight-adjusted coverage, selected goal and individual gram shares. The deprecated `confidence`
field aliases rounded weighted coverage; it is not a probability or calibrated confidence. Incomplete
data is displayed as a status, never as 0, 50, a low quality grade or an empty `/100`.
The UI also displays explicit potential-conflict hypotheses independently of the mean.

## Separate descriptions and direction

`balanceScore` keeps its formula but the UI names it **fit to the selected sensory profile**
and shows the selected goal. It measures distance to authored model targets, not good taste.
Texture remains mass-weighted descriptive potential from 0.4, without final-dish inference.
Neither raises the compatibility index. The historical harmonic helper is deprecated and is
not used by the 0.5 engine.

Proportions are shown as grams and percentages of entered edible mass, without a quality
grade. The old `quantityScore` remains a deprecated numerical diagnostic for compatibility
with versioned analysis records; new UI and AI context do not present it as approval.
Exceeding an authored share maximum is now an informational, explicitly unreviewed trial-range
signal. It does not assert that a real recipe quantity is excessive without its purpose.
No ingredient roles or functional groups are guessed for the user.

Recommendations compare the existing bounded trial amounts using improvement of profile fit.
Only a positive displayed `balanceDelta` qualifies; candidates with an explicit conflict rule
against an existing ingredient are omitted. Unknown compatibility does not become a penalty or
bonus. Ranking uses raw fit improvement, preferred goal role for ties, then stable ID; grouping
still avoids role/texture filler. Amount/method preview and Apply stay exact. `basis:goalFit`
and candidate pair coverage are returned. `overallDelta` may be null (or signed when both
indices exist); it is not the recommendation promise. Changing profile fit is not proof of
better taste or compatibility. A formerly fully assessed composition may become partial when
an unassessed ingredient is previewed; the index becomes unavailable rather than worsening.

## Reported breaded-chicken composition

The fixture contains chicken 500 g roasted; breadcrumbs 60 g roasted; egg 150 g, wheat flour
150 g, lemon juice 54 g, salt 5 g and dill pickle 120 g raw; ketchup 150 g as sauce. For the
crunchy goal, the former 70 index/54 compatibility are now both null: none of the 28 pairs has
an explicit rule. Profile fit remains 92 and potential contrast 27, separately described.
Flour is 12.62% of the entered 1189 g, without an assertion that its quantity is appropriate.
The actual consumed coating or separately served sauce cannot be established from this list.

## API, snapshots and rollout

Rebuild/deploy contracts, engine, Nest and Next together; reload old client tabs. Existing
score field names remain but overallScore, compatibilityScore, pair score and recommendation
compatibility/overallDelta now permit null. Consumers must not coerce null to zero or subtract
unavailable indices. Old analysis snapshots with numerical fields and no coverage metadata
remain readable. Do not rewrite historical feedback or regenerate reviewed catalogue rows.
New feedback and AI cache keys use MODEL_VERSION=0.5.0-hypothesis. No SQL migration is needed.

Composition GPT context receives the ingredient-stage report, known pairs only, the unknown
count and goal-fit trials. It does not receive the deprecated proportion grade or recipe
instructions. Unknown data is explicitly neither support nor conflict. Recipe review/generation
retains its separate workflow and content. Model, token caps, quotas, consent, refunds and
monetary budgets are unchanged; no new provider output schema or dependency is introduced.
Browser/server verification compares the full normalized analysis excluding recommendations,
including nulls, coverage, shares and nutrient contributions.
