# Composition model 0.4.0-hypothesis — 2026-10-20

Historical release description. Current ingredient-stage semantics are
[0.5.0-hypothesis](INGREDIENT_ASSESSMENT.md): explicit pair evidence, unavailable rather than
imputed scores, full-coverage compatibility index, descriptive shares and goal-fit trials.
The texture repair below remains; harmonic aggregation is no longer used by the current engine.

This release repairs count-dependent texture inflation. It does not calibrate culinary
quality or assign an expert-approved replacement grade. Catalogue sensory profiles, shares,
pair adjustments and intensity scales remain unreviewed hypotheses; no source data is edited.

## Diagnosis and reproducible case

The previous texture formula was `clamp(45 + distinctTags*6.5 + min(contrastingPairs,4)*7)`.
It ignored gram amounts and texture intensity. Mixed tags could contrast with themselves;
purée kept original crisp/fibrous tags. A few trace additions could saturate the score.
The overall arithmetic mean also rewarded contrast as if it established culinary quality.

Only nine rows and quantities are visible in the reported screenshot. They are reproduced in
`scoring-policy.test.ts`: milk 150, cucumber 100, lemon 8.8, lime 8.3, avocado 48, cilantro 5.7,
ginger 5.8, fermented miso 9.1, sesame 7.4 grams. The screenshot indicates sixteen rows and a
mayonnaise warning; the other rows and mayo amount are unknown. This is not an exact
reproduction of its 81/100. The visible subset previously gave index 78 and texture 100
(already saturated after the fifth row); it now gives index 69 and potential contrast 36.

## Descriptive texture potential

The original firm family is crisp/crunchy/firm/fibrous; the soft family is
tender/creamy/silky/juicy/flaky/sticky. A prepared row's firmness coordinate is the fraction
of its recognized, unique tags in the firm family. Identical mixed profiles have distance
zero. Unrecognized-only tags contribute no claimed contrast. This is a coarse structural
axis, not a complete psychophysical texture model.

For gram share p_i, firmness x_i, and the existing catalogue texture intensity I_i in 0–10:

`texture = 400 * sum(i<j)[p_i*p_j*abs(x_i-x_j)*max(I_i,I_j)/10]`, bounded to 0–100.

There is no ingredient/tag-count intercept. The normalization is mathematical: for identically distributed independent
draws X,Y in [0,1], E|X-Y|<=1/2; unordered pairs need another factor two. Thus equal masses of
opposite, maximal-intensity textures reach 100, trace amounts have a vanishing effect, and
splitting/ordering/scaling the same mass does not change the result. Intensity is an authored
hypothesis, not a measurement; the stronger texture makes a contrast perceptible against a
smoother component. No fixed minimum grams or food-name exceptions are introduced.

Explicit `pureed` replaces original structure with the method's silky/creamy tags. A generic
`sauce` retains original tags because sauces can contain pieces. The old binary texture-complement bonus is removed from pair compatibility too, so changing
texture tags alone cannot indirectly boost the composition index. Preparation/profile multipliers are unchanged.
No NLP infers whole-dish blending from recipe text. The UI states this limit visibly.

## Overall composition index

Contrast is a descriptor, not a quality criterion: smooth soups/sauces are not automatically
bad. It is excluded from the index and from the recommendation utility bonus. Low contrast
alone no longer emits `flatTexture`; its old contract/locale key remains for stored snapshots.

The three retained criteria keep their original relative weights .38 compatibility, .32
balance and .16 catalogue proportions. Their weighted harmonic mean is
`(.38+.32+.16) / (.38/compatibility + .32/balance + .16/quantity)`, with zero for a zero
criterion. Compared with the former arithmetic mean, this limits compensation of weak
compatibility. For illustration, 20/100/100 yields about 36, and 62/91/90 about 75.
These examples explain aggregation; they do not establish taste thresholds. Balance targets,
quantity ranges, other pair coefficients and score scales are unchanged. The unsupported
confidence bonus for ingredient count is removed; confidence remains an uncalibrated heuristic,
not a probability of a successful dish or professional evidence.

## Upgrade and historical records

Rebuild/deploy contracts, engine, Nest API and Next web together. API field names and numeric
0–100 ranges remain compatible; semantics change under MODEL_VERSION=0.4.0-hypothesis.
AI cache hashes and feedback version checks already include this version, preventing reuse
of old model context. Reopen/reload an older tab before submitting feedback.
Do not rewrite past feedback/analysis snapshots or regenerate reviewed catalogue data: their
recorded model version explains their historical numbers. No SQL migration is needed.

Regression checks cover mass invariants, trace additions, mixed-profile duplication, explicit
purée, weak-criterion compensation, unchanged input/profile data, API/browser agreement and
exact recommendation preview deltas. Professional tasting-labelled calibration is still absent;
no expert ratings, milk-acid chemistry detector, pH model or recipe-format classifier is claimed.
