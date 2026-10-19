# Widget architecture — r2

## A pragmatic layered monorepo

This is a project-specific widget architecture, not a claim of strict conformance to a branded
methodology. We retain one Next app and one Nest API. Widgets are local React modules, not
iframes, separately deployed microfrontends or independently versioned applications.

| Layer | Owns | Must not own |
|---|---|---|
| app | route adapters, metadata, locale provider | recipe CRUD/business rules |
| screens | page composition and feature coordination | duplicate formula implementation |
| widgets | a cohesive, accessible task block | networking, persistence, sibling widgets |
| features | user actions and interaction state | authoritative subscription/ownership decisions |
| entities | domain presentation types, repository/storage adapters | page layout |
| shared | UI primitives, CSS tokens, dictionaries, HTTP utility | dish-specific commercial policy |

Imports go down the table. Sibling business slices do not import each other; a higher layer
orchestrates them. Cross-slice imports use public index.ts exports. External framework/domain
imports are explicit. The script check-widget-architecture.mjs checks local resolution, layer
ranking, public entry points and basic forbidden side effects in widgets. It is not a complete
JavaScript information-flow/security proof.

## State and calculation

`useDishEditor` combines `editorReducer`, persistent draft hydration and pure Flavor Engine
calls. The reducer owns one present draft plus bounded past/future history. Changes clear a
recommendation preview; Apply uses the exact candidate's identity, amount and method.
`BuilderScreen` passes controlled props to widgets, owns modal orchestration and optionally
asks Nest to repeat analysis. Browser values are not trusted for access control or AI prompts.
No separate Analysis store, Composition store or Recommendations store is allowed to drift.

Recommendation cards consume only engine output: portion, exact preparation, conditional reason
IDs and measured before/after changes. Text comes from EN/UK dictionaries. The editor takes the
engine's preparation directly instead of inferring it again. The engine tries catalogue minimum
and ideal shares for the current composition/goal, suppresses non-improving additions and repeated
role/texture groups, and never fills six slots with a static list. See [API.md](API.md) for the
0.3.1 response and coordinated rebuild instructions. This remains a deterministic hypothesis.

The builder has Composition/Preparation tabs over that same reducer. The draft also owns
description, optional servings, and ordered preparation steps with stable UUIDs. Consecutive
text edits in one field are grouped in undo history; switching fields, blur, a one-second
pause, and structural actions separate groups. Tab selection and field focus are UI state.
Preparation edits preserve the items/goal references used by calculation memoization.
Steps and servings persist in device storage, recipe JSON v2 and cloud records after the
recipe/AI migration. Cloud adapters retain them; versions and remixes carry the same content.
New clients supply expectedVersionNumber to prevent overwriting a stale cloud recipe.

Local input strings (e.g. incomplete grams) may live inside a row until valid. Search dropdown
and collapsible help are UI-only state. Private/account identifiers remain in the draft entity,
not public visual models. Data loading/error boundaries surround coherent widgets.

Ingredient rows offer grams and reference-backed pieces/ml. The shared engine's pure unit
helpers produce canonical edible grams; the same editor reducer retains optional original
quantity/factor for Undo and persistence. A row's decimal text and open weight details remain
presentation state. Read-only recipe/context views display the retained units beside gram
equivalents. See [INGREDIENT_UNITS.md](INGREDIENT_UNITS.md) for sources and database rollout.

## Visual structure

Desktop: composition and assessment side by side; recommendations below. Mobile: composition,
assessment and recommendations follow reading order. Detailed mode reveals sensory profile and
pair relationships. There is no compulsory carousel, drag handle or ten-score dashboard.
Layout uses the shared CSS token system, not inline per-widget theme constants or Tailwind.

Preparation: the instructions editor and a read-only ingredient reference sit beside each
other on desktop and follow reading order on mobile. Both panels stay mounted behind
accessible tabs so changing stages preserves temporary input. `features/culinary-assistant`
coordinates capabilities, explicit consent, review/explanation requests, optional automatic
step reviews, snapshot invalidation and explicit suggestion application. `entities/ai` owns
HTTP adapters; `widgets/culinary-assistant` receives state/callbacks without networking or
storage. An enabled automatic review needs an actual edit while Preparation is active;
opening a tab or changing the locale alone never generates a request. Both assistant panels
share one controller. Its response only applies to the same content/language snapshot and
uses the editor reducer/undo history. See [the recipe workspace plan](RECIPE_WORKSPACE_PLAN.md).
Full review keeps a separate finished-dish forecast and cooking advice so automatic step
comments cannot erase it. Generation has its own preview and optional brief; edits invalidate
old suggestions. A confirmation applies the generated text as one reducer operation with Undo,
without changing selected ingredients, grams, preparation methods, goal or saved identity.
Nothing is saved to the account or published by generation or preview application.

The composition assistant requests a structured culinary review with the same recipe snapshot,
including existing written preparation. Its presentation separates verdict, strengths, risks,
priority actions (instruction/reason/effect) and missing context; legacy score explanations have
a rollout fallback. Optional addition grams/preparation are server-owned engine metadata. Advice
is read-only and never changes the composition or forces additional ingredients. EN/UK dictionaries
own all section labels. Consent, quotas, snapshot invalidation and the 2-unit charge stay shared
with the existing assistant feature.

## Feedback and public discussion

The assessment widget exposes an optional feedback slot, composed by the builder/recipe
screens with the `model-feedback` feature. That feature freezes the current recipe when the
form opens and sends only on explicit submission. Analysis snapshots are recomputed and stored
by Nest. Private feedback never appears in the public recipe discussion.

RecipeScreen composes `recipe-comments` using the `recipe-discussion` feature controller and
entity repositories. The widget owns focus and deletion-confirmation state only; all loading,
pagination, authenticated mutations and retry state live in the feature. Cloud recipe version
metadata survives editor transfer/save/undo without entering recipe JSON exports.

## Administration and support

AdminScreen gates the workspace through the administration feature's server access check and
MFA flow. It composes the pure admin-workspace widget for records/inspection and the shared
support-desk widget for operator conversations. SupportScreen composes that same presentation
with an owner-scoped support controller. The administration/support entities own API adapters;
widgets own only local form/dialog state. Async responses are scoped by account and request.
AccountScreen exposes support, the conditional owner entry, and feedback-permission controls.
No protected records are rendered into static route HTML. See [ADMINISTRATION.md](ADMINISTRATION.md).

## Adding a widget

Create widgets/<task-name>/ui and index.ts. Define props in the UI module. Add the action in
features or entity adapter as needed. Compose it in the relevant screen. Supply EN/UK copy,
empty/loading/error/disabled states, keyboard behavior and tests. Run check:widgets,
check:syntax, typecheck and the affected integration/browser tests before accepting it.
