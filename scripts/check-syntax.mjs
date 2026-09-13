import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let files=0,errors=0;
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){
 if(['node_modules','dist','.next','.git','.core-test'].includes(item.name))continue;
 const file=path.join(dir,item.name);
 if(item.isDirectory())walk(file);
 else if(/\.tsx?$/.test(item.name)){
  files++;const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  for(const diagnostic of source.parseDiagnostics){errors++;console.error(path.relative(root,file),ts.flattenDiagnosticMessageText(diagnostic.messageText,' '));}
 }
}}
walk(root);console.log(JSON.stringify({files,syntaxErrors:errors,typescript:ts.version,scope:'Syntax only; no external dependency resolution.'}));
process.exitCode=errors?1:0;
