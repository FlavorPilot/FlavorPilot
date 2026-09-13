/** Compile and execute the real dependency-free kernel. Not a full app typecheck. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');
const output = path.join(root, '.core-test');
fs.rmSync(output, { recursive: true, force: true });
console.log(`Strict kernel compilation using TypeScript ${ts.version}`);
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.core.json'], { cwd: root, stdio: 'inherit' });
// Resolve the real compiled domain-only subpath, without installing unrelated dependencies.
const domain = path.join(output, 'node_modules/@flavorpilot/contracts');
fs.mkdirSync(domain, {recursive: true});
fs.writeFileSync(path.join(domain, 'package.json'), JSON.stringify({name:'@flavorpilot/contracts',exports:{'./domain':'./domain.js'}}));
fs.copyFileSync(path.join(output, 'contracts/src/domain.js'), path.join(domain, 'domain.js'));
execFileSync(process.execPath, ['--test', 'tests/core/kernel.test.cjs'], { cwd: root, stdio: 'inherit' });
console.log('Kernel tests use the actual emitted source. React, Next, Nest and database execution were NOT tested by this command.');
