# FlavorPilot widget frontend

Read the root AGENTS.md first. Product/domain authority still belongs to Nest and packages/flavor-engine.

Dependency direction: app → screens → widgets → features → entities → shared.
`screens` is the page-composition layer; do not create `src/pages` beside the Next App Router.

- Widgets are meaningful independent sections, not iframes, web components, microfrontends or a new engine.
- Every widget/slice exports a public API via index.ts. Never deep-import another slice or import a sibling widget.
- Screens orchestrate. Features implement actions. Entities own client models/adapters. Shared UI stays domain-neutral.
- Keep computation in @flavorpilot/flavor-engine; source coefficients must not change silently. Confidence in this baseline is 0–100.
- Browser draft, account record, and public recipe are different things. Never imply publication after localStorage save.
- The same grams and preparation must be used for preview and apply. Preview never mutates or auto-saves the committed composition.
- Preserve saved identities when undoing. Never overwrite corrupted storage silently.
- Working drafts are scoped by authenticated account ID or guest; the legacy browser library keeps its original storage key.
- All new copy requires EN and UK. Keyboard, focus, touch, error, empty and loading states are required.
- Do not enable paid checkout or AI usage without server-side entitlements/quotas. No mocked Pro upgrades.
- No new runtime libraries were needed for this refactor. Do not add a state library just to wrap useReducer.
- Run `npm run check:widgets`, `npm run test:widgets`, `npm run typecheck`, `npm test`, `npm run build`.
- A transpile or screenshot pass is not evidence of a successful Next production build.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
