# Widget catalogue

Each slice has a public `index.ts`; the source props remain authoritative.

## AppShell

Path: `apps/web/src/widgets/app-shell`.

Input: locale + children.

States: navigation, mobile navigation, current route.

Rule: No recipe or plan authority. Session status comes via a feature.

Review: corresponding dictionaries, mobile layout, keyboard focus and the composing screen.

## AuthPanel

Path: `apps/web/src/widgets/auth-panel`.

Input: locale + form state + submit handlers.

States: entry, submitting, sent, failure, unavailable.

Rule: Presentational form; Supabase calls are in authentication feature.

Review: corresponding dictionaries, mobile layout, keyboard focus and the composing screen.

## DishToolbar

Path: `apps/web/src/widgets/dish-toolbar`.

Input: controlled name/goal, history status, save/export/new callbacks.

States: dirty/autosaved, invalid/empty save, undo/redo enabled.

Rule: Reset is confirmed at screen level; no persistence inside toolbar.

Review: corresponding dictionaries, mobile layout, keyboard focus and the composing screen.

## DishComposition

Path: `apps/web/src/widgets/dish-composition`.

Input: items, totalWeight, onAdd/onUpdate/onRemove/onExample.

States: empty, populated, invalid amount, maximum 24.

Rule: One authoritative draft. Different supported preparations may coexist.

Review: corresponding dictionaries, mobile layout, keyboard focus and the composing screen.

## RecipeInstructions

Path: `apps/web/src/widgets/recipe-instructions`.

Input: controlled description/servings/steps, locale, editing and history-boundary callbacks.

States: empty, editing, invalid servings, 40-step limit, deletion confirmation.

Rule: UUIDs and mutations belong to the editor feature. This widget owns only temporary
field text, focus, and confirmation state; it performs no storage or network requests.

## RecipeContext

Path: `apps/web/src/widgets/recipe-context`.

Input: items and locale.

States: empty composition or read-only localized ingredients, preparation and grams.

Rule: The first tab owns ingredient editing. No copy of the composition is maintained here.

## RecipeComments

Path: `apps/web/src/widgets/recipe-comments`.

Input: discussion feature state/actions, locale, current user ID, recipe version and refresh callback.

States: loading, empty, guest/sign-in, composer, replying, paging, errors/retry, stale recipe,
posted/deleted status and deletion confirmation. Each comment displays its recipe version.
Rule: no networking/storage in the widget. Its local state owns focus and confirmation only.
The screen mounts it only for actual public cloud recipes, not examples or share-link pages.

## DishAnalysis

Path: `apps/web/src/widgets/dish-analysis`.

Input: analysis + itemCount + locale.

States: insufficient input, assessment, issue, details, published composition.

Rule: Displays actual overall and balance separately; never invents a score.

An optional feedback slot receives the model-feedback action composed by a screen. The widget
does not authenticate or submit a feedback request itself.

Published composition has an information note and independent coverage notes for protein, fat,
carbohydrate, sugars, sodium and energy. Each note receives kernel contributions, never sums
amounts in the widget, and exposes missing rows/source IDs. Shared `HoverNote` supports hover,
focus, keyboard links, Escape, click/tap dismissal and a portal constrained to the viewport.

Review: corresponding dictionaries, mobile layout, keyboard focus and the composing screen.

## DishRecommendations

Path: `apps/web/src/widgets/dish-recommendations`.

Input: recommendations + onPreview + disabled.

States: empty, candidate list, row limit.

Rule: No direct Apply: the screen offers a reversible preview first.

Review: corresponding dictionaries, mobile layout, keyboard focus and the composing screen.

## ChangePreview

Path: `apps/web/src/widgets/change-preview`.

Input: candidate, before, after, onApply/onCancel.

States: preview pending or kept/discarded.

Rule: No hidden mutation; exact grams and preparation are carried through.

Review: corresponding dictionaries, mobile layout, keyboard focus and the composing screen.

## SensoryProfile

Path: `apps/web/src/widgets/sensory-profile`.

Input: profile + locale.

States: relative dimensions 0–10.

Rule: Not a nutrition or food-safety assessment.

Review: corresponding dictionaries, mobile layout, keyboard focus and the composing screen.

## IngredientPairings

Path: `apps/web/src/widgets/ingredient-pairings`.

Input: pair results + locale.

States: empty, pair table.

Rule: A pair is not a judgment about an entire dish.

Review: corresponding dictionaries, mobile layout, keyboard focus and the composing screen.

## RecipeCollection

Path: `apps/web/src/widgets/recipe-collection`.

Input: recipes + open/delete callbacks.

States: empty, local/cloud/example cards.

Rule: No fake popularity, no automatic publication or deletion.

Review: corresponding dictionaries, mobile layout, keyboard focus and the composing screen.

## PlanComparison

Path: `apps/web/src/widgets/plan-comparison`.

Input: locale.

States: current free preview and planned Pro capabilities.

Rule: No pretend checkout or fabricated paid entitlement.

Review: corresponding dictionaries, mobile layout, keyboard focus and the composing screen.
