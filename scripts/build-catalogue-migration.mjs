/** Run after rebuilding packages and the three catalogue seeds. Existing DB: apply after 0007. */
import { readFileSync, writeFileSync } from 'node:fs';
const seeds = ['seed-scoring-hypotheses.sql','seed-identities.sql','seed-nutrient-hypotheses.sql'];
const body = seeds.map(name => readFileSync(new URL(`../supabase/${name}`,import.meta.url),'utf8').replace(/^begin;\r?\n/gm,'').replace(/^commit;\r?\n/gm,'')).join('\n');
writeFileSync(new URL('../supabase/migrations/0008_catalogue_expansion.sql',import.meta.url), `-- Data-only expansion to 620 culinary hypotheses / 619 USDA citations. Apply after 0007.\n-- No reviewed records are overwritten. Existing private recipes and visibility are untouched.\nbegin;\n${body}commit;\n`);
