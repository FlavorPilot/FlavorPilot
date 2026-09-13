import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = false;
console.log('Node:', process.version, 'Platform:', process.platform, process.arch);
if (Number(process.versions.node.split('.')[0]) !== 22 || Number(process.versions.node.split('.')[1]) < 16) {
    console.error('Use Node.js 22.16 or newer in the 22.x line for this workspace.');
    failed = true;
}
for (const [workspace, names] of [['apps/web', ['next', 'react', 'react-dom']], ['apps/api', ['@nestjs/core', 'fastify', '@fastify/static']], ['.', ['typescript']]]) {
    const require = createRequire(path.join(root, workspace, 'package.json'));
    for (const name of names) {
        try {
            console.log(name, require(name + '/package.json').version);
        }
        catch {
            console.error(name, 'NOT INSTALLED');
            failed = true;
        }
    }
}
console.log('Full acceptance testing must run in native Node/WSL/Docker or a real VM, not a StackBlitz WebContainer.');
process.exitCode = failed ? 1 : 0;
