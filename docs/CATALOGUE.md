# Culinary hypotheses and published composition

Catalogue version: `2026-10-18-ai-2`. There are 620 distinct ingredient IDs: the unchanged 38
transcribed profiles, 82 existing `product-hypothesis-1` profiles, and 500 additions using
`ai-product-hypothesis-2`. The additions are curated in `scripts/data/catalogue-expansion.txt`
with bilingual names and exact FDC IDs. They are foods, species and useful pantry products;
brands, arbitrary meat cuts and chopping shapes are not used to inflate the count.

## Two separate kinds of data

The **culinary estimate is an AI-authored hypothesis**. It uses food-family starting profiles,
explicit per-food axes and named exceptions in `scripts/data/catalogue-families.mjs`. Every food
has ten sensory axes, aromatic/texture tags, intensity, roles, working share and supported
methods on the existing model's scales. These values are composed culinary guesses; they are
not USDA measurements, probabilities or sensory-panel results. Family membership is reused
where sensible; the file makes that reuse and every override inspectable. No random noise or
nutrient-density conversion is used to create these sensory profiles. The runtime remains the
existing deterministic engine; no external AI provider is called during editing.

New provenance stays `unreviewed`, confidence 0, reviewer/time null. AI provenance is available
through `aiIngredientKnowledge`, separately from historic demo attribution and USDA identity
citations. Reviewed-coverage targets are not met by generating hypotheses. Model coefficients,
the original 120 profiles and the 64 pair adjustments are unchanged. Recommendations now
consider all 620 ingredients, so suggestion ordering can change. The inherited default score
remains 74 (balance 61; weight 313 g).

The editor's initial amount now uses the existing kernel recommendation helper, including
fractional grams for concentrated spices. Selecting saffron no longer forces a 1 g minimum;
the existing helper proposes 0.3 g for a 240 g working dish. Recommendation coefficients and
preview/apply amounts are unchanged.

The **published composition is factual reference data**: protein, total fat, carbohydrate,
sugars, sodium and energy from the exact USDA record, scaled from 100 g to dish grams. There
are 619 cited foods; rice vinegar has no matching record in these releases. Missing nutrients
remain null, a published zero counts as covered. Per-row contributions retain precision; the
total is rounded after addition. Each nutrient has independent coverage and a hover/focus/tap
note listing amounts, missing rows, USDA IDs and original source descriptions. Source state
can be raw, dry, fermented, canned or otherwise prepared. The same reference is shown even if
the dish selects another preparation: absorbed water, cooking losses and finished yield are
not inferred. The composition never changes the culinary score.

## Official sources and reproducibility

USDA [download catalogue](https://fdc.nal.usda.gov/download-datasets/), public domain/CC0:

| Archive | SHA-256 |
|---|---|
| [Foundation Foods CSV 2026-04-30](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-04-30.zip) | `70457ee9d9342f43bda2010318c85f04210c689fdeb9cd2da4c513b0e8dbc655` |
| [SR Legacy CSV 2018-04](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip) | `b80817294b8850530aaedf2e515c02593b1824f763a0ff356e5c2081643e6fd0` |

Extract the archives below `.local/fdc/`, keeping their archive directory names, or set
`FDC_DIR` to that parent directory. Downloads and caches are ignored by Git. Use the workspace
Node 22 runtime, and the Windows npm wrapper for workspace commands:

```powershell
$env:FDC_DIR = Join-Path (Get-Location) '.local/fdc'
& .local/node-v22.23.3-win-x64/node.exe scripts/build-sourced-identities.mjs
& .local/node-v22.23.3-win-x64/node.exe scripts/build-nutrient-hypotheses.mjs
.\scripts\npm.ps1 run build:packages
& .local/node-v22.23.3-win-x64/node.exe scripts/build-scoring-seed.mjs
& .local/node-v22.23.3-win-x64/node.exe scripts/build-catalogue-migration.mjs
& .local/node-v22.23.3-win-x64/node.exe scripts/verify-fdc-catalogue.mjs
```

The identity builder also emits the expanded profile module. The source verification compares
all exact descriptions, selected nutrient IDs/amounts and missing-value states to the CSVs.
Duplicate nutrient rows prefer the greater reported data-point count; nutrient alternatives
retain the existing priority (e.g. total fat 1004 then 1085, sugars 2000 then 1063). The original
119 identities/nutrients were verified unchanged after regeneration. Historical migrations
0006/0007 are no longer rewritten during routine generation. Migration 0008 is a data-only
snapshot for an existing database after 0007; see [DATABASE.md](DATABASE.md).
Once released, keep that migration immutable and create the next numbered migration for
future catalogue changes instead of regenerating a released snapshot.

## Validation

Tests cover unique bilingual IDs/names, finite sensory axes, valid shares/methods, culinary
distinctions, all additions participating in scoring, source attribution, missing versus zero,
per-nutrient totals, preparation rows and API-contract retention. Database tests save new foods
through the API and run migration 0008 twice while preserving a reviewed probe and private
recipes. Browser scenarios cover individual coverage notes, source links, hover, keyboard,
Escape, touch, Ukrainian labels and narrow-screen containment. Passing these checks does not
validate whether someone will enjoy the dish.
