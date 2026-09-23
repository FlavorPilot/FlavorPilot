/** Write the composed product-hypothesis rows for foods outside the transcribed 38. */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { hypothesisIngredients } = require('../packages/flavor-engine/dist/scoring-catalogue.js');
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
    ['source_note', q(note)],
    ['source', q(note)],
    ['model_version', q(version)],
];
let seed = '-- GENERATED product-hypothesis-1 scoring rows. Does not overwrite a reviewed ingredient.\nbegin;\n';
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
writeFileSync(new URL('../supabase/migrations/0006_product_hypotheses.sql', import.meta.url), migration);
console.log(`Scoring hypotheses: ${hypothesisIngredients.length}`);
