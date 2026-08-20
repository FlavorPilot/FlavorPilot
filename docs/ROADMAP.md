# Roadmap

## Phase 0 — This archive

Goal: prove the product interaction and establish clean architecture.

- Bilingual builder and landing pages.
- Deterministic demo Flavor Engine.
- Local save, privacy controls, discovery, and remix.
- NestJS API, PostgreSQL/Supabase schema and optional AI endpoint.

## Phase 1 — Validated prototype

Goal: determine whether real cooks find the output credible.

- Recruit 5–10 culinary reviewers.
- Define a benchmark of at least 50 dishes and controlled modifications.
- Expand to 100–150 high-frequency ingredients with source provenance.
- Add an internal ingredient editor and review states.
- Record qualitative disagreement instead of hiding uncertainty.
- Instrument activation and recommendation usage.

Exit signal: repeated weekly use and at least several users asking to keep private work.

## Phase 2 — Multi-user beta

Goal: replace demo persistence and test willingness to pay.

- Supabase email/OAuth authentication.
- Server-backed dishes and profiles.
- Public/unlisted/private read paths.
- Favorites, remix trees, reporting, deletion, and basic moderation.
- Payment provider, webhook verification, and entitlements.
- Free limit and Pro private workspace enforced server-side.
- Rate limiting, error monitoring, backups, and legal pages.

Exit signal: first recurring paid subscriptions with meaningful retention.

## Phase 3 — Professional creation workflow

Goal: make Pro valuable beyond novelty.

- Version comparison showing sensory changes.
- Add/remove/replace scenarios.
- User-defined ingredient data and pantry availability.
- Controlled AI deep explanation and usage budgets.
- Exports and shareable showcase pages.
- 300–500 validated ingredients.

## Phase 4 — Chef Studio

Goal: connect creativity with operations.

- Costing and supplier prices.
- Yield loss and cooked output.
- Nutrition and allergen calculations.
- Portion scaling and purchasing list.
- Technical cards and PDF/print export.

## Phase 5 — Kitchen and API

Goal: expand into B2B after individual fit.

- Organizations, locations, roles, approvals, and recipe standards.
- Menu engineering and change alerts.
- Flavor Engine API with usage limits and contractual data terms.
- R&D workflows for food manufacturers.

## Metrics to watch

- visitor → first ingredient added;
- first dish completed;
- recommendation accepted;
- dish saved;
- return within 7 and 30 days;
- public dish viewed/remixed;
- private limit reached;
- paywall started/completed;
- score usefulness rating after actual cooking.
