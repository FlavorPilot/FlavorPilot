import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const checks = [];

function record(name, passed, details = "") {
  checks.push({ name, passed, details });
}

function assertCheck(name, condition, details = "") {
  record(name, Boolean(condition), details);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (["node_modules", ".git", ".next", "dist", "coverage"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else files.push(absolute);
  }
  return files;
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function resolveRelativeImport(sourceFile, specifier) {
  const base = path.resolve(path.dirname(sourceFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.mjs`,
    `${base}.json`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.js"),
    path.join(base, "index.mjs")
  ];
  return candidates.some((candidate) => existsSync(candidate));
}

const requiredFiles = [
  "package.json",
  "apps/web/package.json",
  "apps/api/package.json",
  "apps/api/src/main.ts",
  "apps/api/src/flavor/flavor.controller.ts",
  "apps/api/src/dishes/dishes.controller.ts",
  "packages/contracts/src/index.ts",
  "packages/flavor-engine/src/index.ts",
  "supabase/schema.sql",
  "supabase/seed.sql",
  "apps/api/Dockerfile",
  "vercel.json",
  "railway.json"
];

for (const file of requiredFiles) {
  assertCheck(`required:${file}`, existsSync(path.join(root, file)), file);
}

const allFiles = await walk(root);
const jsonFiles = allFiles.filter((file) => file.endsWith(".json"));
const jsonErrors = [];
for (const file of jsonFiles) {
  try {
    JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    jsonErrors.push(`${relative(file)}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
assertCheck("all JSON files parse", jsonErrors.length === 0, jsonErrors.join("\n"));

const rootPackage = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
assertCheck(
  "workspace layout declared",
  Array.isArray(rootPackage.workspaces) &&
    rootPackage.workspaces.includes("apps/*") &&
    rootPackage.workspaces.includes("packages/*")
);
assertCheck("project name is flavorpilot", rootPackage.name === "flavorpilot", rootPackage.name);
assertCheck(
  "root version is semantic",
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(rootPackage.version),
  rootPackage.version
);
assertCheck(
  "structural validation command is exposed",
  rootPackage.scripts?.["validate:structure"] === "node scripts/project-smoke.mjs"
);

const packageFiles = [
  "apps/api/package.json",
  "apps/web/package.json",
  "packages/contracts/package.json",
  "packages/flavor-engine/package.json"
];
const workspaceProtocolOccurrences = [];
const workspaceVersionErrors = [];
const localDependencyErrors = [];
for (const packageFile of packageFiles) {
  const absolute = path.join(root, packageFile);
  const body = await readFile(absolute, "utf8");
  if (body.includes("workspace:")) workspaceProtocolOccurrences.push(packageFile);
  const manifest = JSON.parse(body);
  if (manifest.version !== rootPackage.version) {
    workspaceVersionErrors.push(`${packageFile}: ${manifest.version}`);
  }
  for (const dependencyName of ["@flavorpilot/contracts", "@flavorpilot/flavor-engine"]) {
    const version = manifest.dependencies?.[dependencyName];
    if (version !== undefined && version !== rootPackage.version) {
      localDependencyErrors.push(`${packageFile}: ${dependencyName}=${version}`);
    }
  }
}
assertCheck(
  "workspace package versions match root",
  workspaceVersionErrors.length === 0,
  workspaceVersionErrors.join("\n")
);
assertCheck(
  "npm-compatible local workspace dependencies",
  workspaceProtocolOccurrences.length === 0 && localDependencyErrors.length === 0,
  [...workspaceProtocolOccurrences, ...localDependencyErrors].join("\n")
);

const generatedArtifacts = allFiles
  .map(relative)
  .filter((file) => file.endsWith(".tsbuildinfo") || file.includes("/.next/") || file.includes("/dist/"));
assertCheck("no generated build artifacts committed", generatedArtifacts.length === 0, generatedArtifacts.join("\n"));

assertCheck(
  "Next frontend contains no API route directory",
  !existsSync(path.join(root, "apps/web/src/app/api"))
);

const contractsSource = await readFile(path.join(root, "packages/contracts/src/flavor.ts"), "utf8");
const dictionariesSource = await readFile(path.join(root, "apps/web/src/i18n/dictionaries.ts"), "utf8");
assertCheck(
  "English and Ukrainian locales are declared",
  contractsSource.includes('["en", "uk"]') &&
    /const\s+en\s*:\s*Dictionary/.test(dictionariesSource) &&
    /const\s+uk\s*:\s*Dictionary/.test(dictionariesSource)
);

const tsFiles = allFiles.filter((file) => /\.(?:ts|tsx)$/.test(file) && !file.endsWith(".d.ts"));
const unresolvedImports = [];
const importPattern = /(?:from\s+|import\s*\(|export\s+\*\s+from\s+)["']([^"']+)["']/g;
for (const file of tsFiles) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (specifier?.startsWith(".") && !resolveRelativeImport(file, specifier)) {
      unresolvedImports.push(`${relative(file)} -> ${specifier}`);
    }
  }
}
assertCheck("all relative TypeScript imports resolve", unresolvedImports.length === 0, unresolvedImports.join("\n"));

const flavorIndex = await readFile(path.join(root, "packages/flavor-engine/src/index.ts"), "utf8");
assertCheck(
  "Flavor Engine re-exports shared contracts",
  flavorIndex.includes('export * from "@flavorpilot/contracts"')
);

const apiSource = await Promise.all(
  allFiles
    .filter((file) => file.startsWith(path.join(root, "apps/api/src")) && file.endsWith(".ts"))
    .map((file) => readFile(file, "utf8"))
);
const apiJoined = apiSource.join("\n");
assertCheck(
  "Nest modules cover health, flavor, AI, auth, database and dishes",
  ["HealthModule", "FlavorModule", "AiModule", "AuthModule", "DatabaseModule", "DishesModule"].every(
    (name) => apiJoined.includes(name)
  )
);
assertCheck(
  "catalog input is validated server-side",
  apiJoined.includes("assertValidDishItems") && apiJoined.includes("UNKNOWN_INGREDIENT")
);

const sql = await readFile(path.join(root, "supabase/schema.sql"), "utf8");
const requiredSqlTokens = [
  "create table public.dishes",
  "create table public.dish_versions",
  "create table public.subscriptions",
  "enforce_private_dish_limit",
  "validate_dish_parent",
  "preserve_dish_parent_lineage",
  "validate_dish_item_catalog",
  "normalize_dish_publication",
  "enable row level security"
];
const missingSqlTokens = requiredSqlTokens.filter((token) => !sql.toLowerCase().includes(token));
assertCheck("database schema contains required safeguards", missingSqlTokens.length === 0, missingSqlTokens.join("\n"));

const envFiles = [".env.example", "apps/api/.env.example", "apps/web/.env.example"];
const leakedSecrets = [];
for (const envFile of envFiles) {
  const body = await readFile(path.join(root, envFile), "utf8");
  for (const line of body.split(/\r?\n/)) {
    if (/^[A-Z0-9_]+=.+/.test(line) && !/^\w+=(?:https?:\/\/localhost[^\s]*|0\.0\.0\.0|development|auto|true|false|v1|4000|10|gpt-5-mini)$/.test(line)) {
      const [, value = ""] = line.split("=", 2);
      if (value && !value.includes("YOUR_PROJECT") && !value.includes("your-domain")) {
        leakedSecrets.push(`${envFile}: ${line.split("=")[0]}`);
      }
    }
  }
}
assertCheck("example env files contain no populated secrets", leakedSecrets.length === 0, leakedSecrets.join("\n"));

const sourceStats = await Promise.all(tsFiles.map((file) => stat(file)));
const sourceBytes = sourceStats.reduce((sum, entry) => sum + entry.size, 0);
record("source inventory", true, `${tsFiles.length} TS/TSX files, ${sourceBytes} bytes`);

const failed = checks.filter((check) => !check.passed);
for (const check of checks) {
  const marker = check.passed ? "PASS" : "FAIL";
  console.log(`${marker.padEnd(4)} ${check.name}${check.details ? ` — ${check.details}` : ""}`);
}

console.log(`\n${checks.length - failed.length}/${checks.length} structural checks passed.`);
if (failed.length > 0) process.exitCode = 1;
