# Source audit and intentional engineering changes

## Requested basis

1. The attached `flavorpilot-widget-refactor-r1.zip`: widget UI sources, model tests,
   original static-fixture renderer and architecture checker. Its overlay is integrated here;
   its separate assembler is not required or shipped as the installation method.
2. FlavorPilot/FlavorPilot main read through the GitHub connector at commit
   `78c1a533f9fde64512ee77645509ed753f28fbcd` (2026-08-20).
   The original architecture is Next + Nest/Fastify + shared contracts + deterministic engine.
3. Read source files: AGENTS.md; contracts (flavor/dishes/api); ingredients and engine;
   API dishes/database/auth/AI and configuration; Supabase schema; original LICENSE.

The earlier full v0.3 archive and original full lockfile were not mounted in this task's
filesystem. Backend/core files were assembled from retrieved source text, not copied from an
unavailable ZIP. This is **not a byte-identical mirror of GitHub**. Formatting, type organization
and the following behavior changes are intentional. Source is read-only; no commits were made.

## Retained

- English/Ukrainian names and canonical ingredient/preparation IDs.
- 38 ingredients, 12 methods, 64 explicit pair adjustments, 10 directions and four examples.
- Source numerical coefficients/formulas; model and dataset remain unvalidated hypotheses.
- Core dish endpoints, UUID identities, ownership, visibility, versions and remix parent links.
- Source-derived direct npm dependency versions, internal workspace names/version 0.3.0.
- Private local data key `flavorpilot:saved-dishes:v1`; imports do not preserve access claims.
- LICENSE text and the no-LLM-generated-scores rule.

## New implementation decisions in r2 (not claims from the sources)

- A complete monorepo replaces the r1 overlay distribution. No local source path is required.
- Pure domain definitions extracted into the contracts/domain subpath for dependency-free
  kernel compilation; Zod schemas and boundary parsers remain in the contracts entry point.
- Strict non-empty `allOf` SQL predicates replace assertion-only access filter calls.
- Mutations use the same recipe transaction model; overlapping update reads gain a conflict
  check. This is not full client revision/If-Match concurrency control.
- Free private capacity locks the owner's profile on the database side to serialize writers.
  Editing already private recipes after a downgrade does not force publication or deletion.
- Direct anon/authenticated product-table Data API access is revoked. Product writes and
  share-token reads go through Nest. Existing RLS is retained as defense-in-depth; trusted
  direct Nest database sessions are not automatically end-user RLS sessions.
- AI input changes from client analysis to composition. Nest recomputes the analysis before
  explaining it. AI is disabled by default and blocked in production until budgets exist.
- TLS local-host detection checks the parsed hostname rather than searching the whole URL.
  Proxy headers are not blindly trusted by default.
- Source seed rows are labeled unreviewed; inserted database confidence is 0, not evidence.
  `ON CONFLICT DO NOTHING` avoids overwriting reviewed entries. The original model's heuristic
  confidence formula is not changed and should not be confused with data provenance.
- UI reset confirmation, native CSS instead of unused Tailwind dependencies, runnable pure
  kernel regression tests and a full source-based handoff were added.

## Reconciliation limits

A transcription fixture detects later drift, not independent transcription correctness or
culinary truth. The default model result was executed and recorded in tests (74 overall,
61 balance for the default fresh composition). A real missing rosemary dose warning is tracked
as CUL-001 instead of being silently removed or called a passing original test.

No production build, npm resolution, Supabase migration or provider authentication was proved
by static parsing. See VALIDATION.md. This archive must pass those checks in a native environment.

## Technical references used for implementation context

These official references explain tooling, not validate project completion or culinary data:

- https://nextjs.org/docs/app/getting-started/installation
- https://docs.npmjs.com/cli/commands/npm-ci/
- https://docs.nestjs.com/openapi/introduction
- https://developer.stackblitz.com/platform/webcontainers/troubleshooting-webcontainers
- https://developers.openai.com/api/reference/resources/responses/
