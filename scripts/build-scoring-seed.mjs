/** Write the composed product-hypothesis rows for foods outside the transcribed 38. */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { hypothesisIngredients } = require('../packages/flavor-engine/dist/scoring-catalogue.js');
const { expandedProductHypotheses, AI_HYPOTHESIS_VERSION } = require('../packages/flavor-engine/dist/expanded-product-hypotheses.js');
const q = value => `'${String(value).replaceAll("'", "''")}'`;
const arr = values => values.length ? `array[${values.map(q).join(',')}]::text[]` : `'{}'::text[]`;
const json = value => `${q(JSON.stringify(value))}::jsonb`;
const note = 'product-hypothesis-1 composed from the character of the food, on the same 0-10 scale as the transcribed catalogue. Not a reviewed taste measurement.';
const version = 'product-hypothesis-1';
const assignments = item => [
    ['sensory_profile', json(item.profile)],
    ['intensity', item.intensity],
    ['texture_intensity', item.textureIntensity],
    ['aromas', arr(item.aromas)],
    ['textures', arr(item.textures)],
    ['roles', arr(item.roles)],
    ['min_share', item.share.min],
    ['ideal_share', item.share.ideal],
    ['max_share', item.share.max],
    ['preparation_ids', arr(item.preparations)],
    ['source_note', q(expandedProductHypotheses[item.id] ? `${AI_HYPOTHESIS_VERSION}: AI-authored culinary hypothesis; not a measured or reviewed taste profile. USDA is the identity/nutrient source only.` : note)],
    ['source', q(expandedProductHypotheses[item.id] ? 'FlavorPilot AI-authored culinary hypothesis, 2026-10-18. scripts/data/catalogue-expansion.txt and catalogue-families.mjs.' : note)],
    ['model_version', q(expandedProductHypotheses[item.id] ? AI_HYPOTHESIS_VERSION : version)],
];
let seed = '-- GENERATED product-hypothesis-1 and ai-product-hypothesis-2 scoring rows. Does not overwrite a reviewed ingredient.\nbegin;\n';
let migration = '-- Replace nutrient-density placeholders with composed product hypotheses. Leaves reviewed rows unchanged.\nbegin;\n';
for (const item of hypothesisIngredients) {
    const fields = assignments(item);
    const insertColumns = ['id', 'name_en', 'name_uk', 'category_en', 'category_uk', ...fields.map(([column]) => column), 'review_status', 'confidence'];
    const insertValues = [q(item.id), q(item.name.en), q(item.name.uk), q(item.category.en), q(item.category.uk), ...fields.map(([, value]) => value), q('unreviewed'), 0];
    seed += `insert into public.ingredients(${insertColumns.join(',')}) values(${insertValues.join(',')}) on conflict (id) do update set ${fields.map(([column]) => `${column}=excluded.${column}`).join(',')} where public.ingredients.review_status='unreviewed';\n`;
    migration += `update public.ingredients set ${fields.map(([column, value]) => `${column}=${value}`).join(',')} where id=${q(item.id)} and review_status='unreviewed';\n`;
}
seed += 'commit;\n';
migration += 'commit;\n';
writeFileSync(new URL('../supabase/seed-scoring-hypotheses.sql', import.meta.url), seed);
if (process.argv.includes('--write-historical-migration'))
    writeFileSync(new URL('../supabase/migrations/0006_product_hypotheses.sql', import.meta.url), migration);
console.log(`Scoring hypotheses: ${hypothesisIngredients.length}`);
