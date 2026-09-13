# Migrating from v0.3.0 or the r1 overlay

1. Commit or back up your current project; export important local recipes as JSON. Keep your
   private `.env` files outside any shared ZIP. Do not force-push or delete the repository.
2. Extract this complete archive to a new empty folder. No `--source`, overlay or rebuild.mjs
   command is needed. Do not merge old `components/`, old `proxy.ts` or old app routes into it.
3. Compare your uncommitted changes with docs/SOURCE_AUDIT.md before copying local modifications.
   This archive is based on the pinned source read, not on unshared work from your computer.
4. Run npm install --include=optional, npm run setup. Re-enter only necessary env settings locally.
   Review/commit the real generated lockfile. Run all native checks in README.
5. Preserve the browser origin for access to the existing localStorage library. Its original
   key remains supported, but legacy public/unlisted labels are not treated as actual publishing.
   A different port/domain has a different browser storage area; export/import intentionally.
6. For an existing DB follow DATABASE.md and staging-test the grant changes. The fresh schema is
   not an upgrade script. Old clients that write directly to Supabase tables must be retired.
7. Only after the new copy passes acceptance, copy the tracked source into a new branch of your
   cloned repository. Keep its .git and verify `git diff --stat`/file paths. Do not copy node_modules,
   secrets, .next, dist, .core-test or editor download duplicates. This archive never pushes itself.

The old r1 package remains useful history, but is not needed to run this distribution.
