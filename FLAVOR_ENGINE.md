# Flavor Engine

The Flavor Engine is a pure TypeScript package under `packages/flavor-engine`.

## Non-negotiable rule

No LLM creates, modifies or overrides a score.

```text
Dish input
  → deterministic Flavor Engine
  → structured analysis
  → optional AI explanation
```

## Current inputs

- ingredient identity;
- grams;
- preparation method;
- optional dish direction/goal.

## Current output components

- pair compatibility;
- whole-dish sensory balance;
- quantity score;
- texture score;
- overall score;
- confidence;
- dominant ingredient;
- issues;
- candidate compatibility and utility;
- recommended grams and expected balance delta.

## Browser and server use

The web app imports the package for immediate interaction. Nest imports the same built package for authoritative calculations. There is one formula implementation, not a frontend and backend copy.

## Data governance before commercial launch

Each profile and explicit pairing needs:

- source/provenance;
- confidence;
- reviewer status;
- version history;
- regional/product-form distinctions;
- test dishes and expected qualitative ordering.

User behavior must not silently rewrite expert coefficients. Feedback should enter a review or model-training pipeline.
