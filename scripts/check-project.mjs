import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url), ts=require('typescript');
const required=['README.md','AGENT.md','AGENTS.md','package.json','apps/web/src/app/[locale]/layout.tsx','apps/web/src/proxy.ts','apps/api/src/main.ts','apps/api/src/app.module.ts','packages/contracts/src/index.ts','packages/contracts/src/domain.ts','packages/flavor-engine/src/engine.ts','supabase/schema.sql','supabase/seed.sql','supabase/migrations/0002_widget_hardening.sql','supabase/migrations/0003_knowledge_provenance.sql','supabase/migrations/0004_ingredient_identities.sql','supabase/seed-identities.sql','apps/api/Dockerfile','docker-compose.yml','docs/ACCEPTANCE.md','docs/KNOWN_LIMITATIONS.md'];
for(const p of required)assert.ok(fs.existsSync(path.join(root,p)),`Missing ${p}`);
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const pkg=read('package.json');assert.deepEqual(pkg.workspaces,['apps/*','packages/*']);
const packages=new Map();for(const p of ['apps/web','apps/api','packages/contracts','packages/flavor-engine']){const j=read(p+'/package.json');assert.equal(j.version,pkg.version);assert.ok(!packages.has(j.name),'Duplicate workspace name');packages.set(j.name,p);}
for(const [name,p] of packages){const j=read(p+'/package.json');for(const [dep,v] of Object.entries(j.dependencies??{}))if(dep.startsWith('@flavorpilot/')){assert.ok(packages.has(dep),`${name} references missing ${dep}`);assert.equal(v,pkg.version);}}
let internalImports=0;
function walk(dir){for(const x of fs.readdirSync(dir,{withFileTypes:true})){
 if(['node_modules','dist','.next','.core-test','.git'].includes(x.name))continue;
 const file=path.join(dir,x.name);
 if(x.isDirectory()){walk(file);continue;}
 assert.ok(!/\s\(\d+\)\./.test(x.name),`Flattened-copy filename ${file}`);
 if(!/\.tsx?$/.test(x.name))continue;
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
 function visit(n){
  if((ts.isImportDeclaration(n)||ts.isExportDeclaration(n))&&n.moduleSpecifier&&ts.isStringLiteral(n.moduleSpecifier)){
   const spec=n.moduleSpecifier.text;
   if(spec.startsWith('.')&&!(path.basename(file)==='next-env.d.ts'&&spec.split(/[\\/]/).includes('.next'))){
    internalImports++;const base=path.resolve(path.dirname(file),spec);
    assert.ok([base,base+'.ts',base+'.tsx',base+'.json',path.join(base,'index.ts'),path.join(base,'index.tsx')].some(p=>fs.existsSync(p)&&fs.statSync(p).isFile()),`Unresolved local import ${spec} in ${file}`);
   }
  }
  ts.forEachChild(n,visit);
 }
 visit(source);
}}
walk(path.join(root,'apps'));walk(path.join(root,'packages'));
execFileSync(process.execPath,[path.join(root,'scripts/check-widget-architecture.mjs')],{cwd:root,stdio:'inherit'});
console.log(`Complete source structure OK: ${packages.size} workspaces, ${required.length} required paths, ${internalImports} relative imports.`);
console.log('These are structural checks, not an installed build or database validation.');
