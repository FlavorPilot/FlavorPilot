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

Local input strings (e.g. incomplete grams) may live inside a row until valid. Search dropdown
and collapsible help are UI-only state. Private/account identifiers remain in the draft entity,
not public visual models. Data loading/error boundaries surround coherent widgets.

## Visual structure

Desktop: composition and assessment side by side; recommendations below. Mobile: composition,
assessment and recommendations follow reading order. Detailed mode reveals sensory profile and
pair relationships. There is no compulsory carousel, drag handle or ten-score dashboard.
Layout uses the shared CSS token system, not inline per-widget theme constants or Tailwind.

## Adding a widget

Create widgets/<task-name>/ui and index.ts. Define props in the UI module. Add the action in
features or entity adapter as needed. Compose it in the relevant screen. Supply EN/UK copy,
empty/loading/error/disabled states, keyboard behavior and tests. Run check:widgets,
check:syntax, typecheck and the affected integration/browser tests before accepting it.
