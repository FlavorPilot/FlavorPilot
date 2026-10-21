# Restored composition scoring — 0.5.1-hypothesis, 2026-10-21

The 0.5.0 coverage-gated replacement was rejected. Restore the original product contract:
one overall model score, ingredient compatibility, flavour balance, proportions and texture
contrast. The ingredient stage estimates the entered composition; recipe-stage GPT review
continues to consider cooking instructions and the finished dish separately.

## Calculation repair, not a different assessment product

All ingredient pairs again receive the existing profile-based calculation: aroma overlap,
sensory complements, intensity difference and any explicit catalogue adjustment. The absence
of one of the 64 manual rules does not disable scoring for the rest of the 620-food catalogue.
Pair evidence distinguishes `hypothesis` (explicit adjustment) from `inferred` (profile model).
Both remain unreviewed hypotheses. An inferred pair's `modelled` signal is not a confirmed
conflict or supporting culinary fact. Historical `unknown` pairs and nullable 0.5 snapshots
remain readable; they are not silently converted or recalculated.

Retain the existing .38/.32/.16 relative weights for compatibility, balance and proportions.
Calculate their weighted harmonic mean H, then `overall = min(compatibility, H)`, rounded
once for display. Any zero component yields zero. Compatibility is a prerequisite: high
balance/proportion scores cannot hide low ingredient compatibility. These are model-policy
weights and a transparent aggregation bound, not professionally calibrated taste coefficients.
For example 62/91/90 now yields 62 rather than about 75. This fixes compensation; it does
not establish that a particular recipe objectively deserves 62.

Texture retains the 0.4 mass-weighted separation calculation, explicit purée handling,
scale/order invariance and vanishing effects of trace amounts. It does not gain points from
ingredient count and does not raise the overall score. Source sensory profiles, working share
ranges, explicit adjustments, preparation multipliers, unit references and nutrients are unchanged.
Proportions retain their original model-range diagnostic. Without ingredient roles/steps this
does not establish actual panading uptake or the suitability of a particular recipe quantity.

Recommendations again search the existing bounded minimum/ideal trial portions for positive
displayed overall-score improvement. Preview and Apply use that exact amount and preparation.
Candidate-only compatibility weights use sqrt(existing impact): the common sqrt(candidate
impact) cancels from the same pair weights used by the full dish. Ranking, reasons and all
displayed deltas are recalculated from the repaired aggregation, with no static ingredient list.

## Regression examples

Default composition: overall 72, compatibility 76, balance 61, proportions 97, texture 0.
The reported eight-row breaded chicken: overall 54, compatibility 54, balance 92, proportions
97, texture 27. All 28 pairs have numeric profile-based hypotheses despite no explicit rules.
The earlier nine visible milk/cucumber/etc rows: overall 55, texture 36; ingredient count
does not saturate texture at 100. These are reproducible calculations, not expert taste labels.

## Rollout and preservation

Publish shared contracts, engine, API and web together; reload old tabs. Current analyses
return numerical scores and do not emit the 0.5.0 `ingredientAssessment` coverage gate.
Contracts retain nullable fields and optional old coverage metadata for saved feedback/history.
Historical 0.5 reports retain historical labels in CRM. New feedback and AI cache keys use
MODEL_VERSION=0.5.1-hypothesis. No SQL migration or changes to recipes, unit metadata, quotas,
model selection, token caps, monetary budgets or provider output formats are required.
Composition GPT receives all scored pair hypotheses and original model dimensions; it still
does not grade the cooked dish from an ingredient list. Labels and explanations are EN/UK.
