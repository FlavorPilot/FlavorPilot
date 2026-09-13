import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'apps/web/src');
const files = [];
const errors = [];
function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory())
            walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name))
            files.push(full);
    }
}
walk(source);
const ranks = { shared: 0, entities: 1, features: 2, widgets: 3, screens: 4, app: 5 };
function classify(file) { const parts = path.relative(source, file).split(path.sep); return { layer: parts[0], slice: parts[1] }; }
function resolveImport(spec, file) {
    const base = spec.startsWith('@/') ? path.join(source, spec.slice(2)) : spec.startsWith('.') ? path.resolve(path.dirname(file), spec) : null;
    if (!base)
        return null;
    const resolved = [base, base + '.ts', base + '.tsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (!resolved)
        errors.push(`${path.relative(root, file)}: unresolved local import ${spec}`);
    return resolved;
}
for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    for (const diagnostic of tree.parseDiagnostics)
        errors.push(`${path.relative(root, file)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`);
    const current = classify(file);
    function visit(node) {
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
            const spec = node.moduleSpecifier.text;
            const target = resolveImport(spec, file);
            if (target) {
                const next = classify(target);
                const currentRank = ranks[current.layer] ?? 5;
                const nextRank = ranks[next.layer] ?? -1;
                if (nextRank > currentRank)
                    errors.push(`${path.relative(root, file)} imports a higher layer: ${spec}`);
                if (nextRank === currentRank && !['shared', 'app'].includes(current.layer) && current.slice !== next.slice)
                    errors.push(`${path.relative(root, file)} imports a sibling slice: ${spec}`);
                if (['widgets', 'features', 'entities', 'screens'].includes(next.layer) && (current.layer !== next.layer || current.slice !== next.slice) && !/^index\.(ts|tsx)$/.test(path.basename(target)))
                    errors.push(`${path.relative(root, file)} bypasses a slice public API: ${spec}`);
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(tree);
    if (current.layer === 'widgets' && /localStorage|fetch\s*\(|\.auth\.(sign|reset|update)/.test(text))
        errors.push(`${path.relative(root, file)}: persistence/network belongs to a feature/entity, not a presentational widget.`);
}
for (const layer of ['screens', 'widgets', 'features', 'entities'])
    for (const entry of fs.readdirSync(path.join(source, layer), { withFileTypes: true }))
        if (entry.isDirectory() && !fs.existsSync(path.join(source, layer, entry.name, 'index.ts')))
            errors.push(`${layer}/${entry.name} has no public API.`);
if (fs.existsSync(path.join(source, 'pages')))
    errors.push('src/pages would activate the Next Pages Router; use screens for compositions.');
if (fs.existsSync(path.join(root, 'apps/web/proxy.ts')))
    errors.push('Duplicate root proxy.ts: locale routing must live next to src/app.');
if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
}
else
    console.log(`Widget architecture OK: ${files.length} TS/TSX files; local imports resolve; layer and public-API boundaries checked.`);
