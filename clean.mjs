import { rm } from "node:fs/promises";

await Promise.all(
  [
    "apps/api/dist",
    "apps/web/.next",
    "packages/contracts/dist",
    "packages/flavor-engine/dist"
  ].map((path) => rm(path, { recursive: true, force: true }))
);
console.log("Removed generated build directories.");
