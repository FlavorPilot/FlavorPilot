# Culinary model and dataset

The checked-in source dataset is a transcription of the v0.3.0 project, not measurements or an
expert endorsement. Those 38 profiles were composed from descriptions of the foods themselves.
The transcription fixture is a regression guard, not an independent source.
No published culinary evidence validates its numbers. Do not mark a composed profile reviewed.

Kernel values are deterministic heuristic outputs, not predicted taste success or food safety.
`dominantIngredient` means the highest-impact ingredient. `outsideRecommendedRange` means a
share above the working maximum. Do not collapse those by changing coefficients. A reviewed
catalogue row needs a reviewer, a source and a review time. The current 38/12/64 scoring rows are unreviewed hypotheses. USDA FoodData Central CC0 identity citations may name a food, its fdc id and its category.
`nutrient-proxy-1` may derive saltiness, fat, sweetness and moisture from published sodium,
fat, sugars and water. That table is evidence beside the identity, not the scoring profile:
its grams-per-10 scale is not the sensory scale of the transcribed 38. Foods outside those 38
enter the score through `product-hypothesis-1`: a composed profile on all ten axes, with aroma,
texture, role, share and preparation, in the same way the original profiles were composed.
They stay unreviewed. A separate composition reference may sum published USDA protein, fat, carbohydrate, sugars, sodium and energy by dish grams. Leave a missing amount out of that sum. Do not fold it into the model score. Alpha coverage is 80–120 reviewed ingredients; 1.0
coverage is 300–500. Do not mark those targets met by generating numbers or by counting
unreviewed citations.
