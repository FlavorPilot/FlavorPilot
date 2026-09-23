/** Build nutrient-proxy-1 hypotheses from local USDA food_nutrient.csv files.
 * Keeps the formula identical to packages/flavor-engine/src/nutrient-hypothesis.ts.
 * Usage: FDC_DIR=/tmp/fdc node scripts/build-nutrient-hypotheses.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = process.env.FDC_DIR ?? '/tmp/fdc';
const FORMULA = 'nutrient-proxy-1';
const ANCHOR = 40000;
const round2 = (value) => Math.round(value * 100) / 100;
const saltinessOf = (sodiumMg) => {
    if (sodiumMg === null)
        return null;
    if (sodiumMg <= 0)
        return 0;
    return round2(Math.max(0, Math.min(10, Math.log10(sodiumMg) / Math.log10(ANCHOR) * 10)));
};
const densityOf = (grams) => {
    if (grams === null)
        return null;
    if (grams <= 0)
        return 0;
    return round2(Math.min(10, grams / 10));
};
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quoted) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 1;
                }
                else
                    quoted = false;
            }
            else
                field += char;
        }
        else if (char === '"')
            quoted = true;
        else if (char === ',') {
            row.push(field);
            field = '';
        }
        else if (char === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        }
        else if (char !== '\r')
            field += char;
    }
    if (field.length || row.length) {
        row.push(field);
        rows.push(row);
    }
    const [header, ...body] = rows.filter(item => item.length > 1);
    return body.map(item => Object.fromEntries(header.map((key, index) => [key, item[index] ?? ''])));
}
const identitiesText = readFileSync(path.join(root, 'packages/flavor-engine/src/sourced-identities.ts'), 'utf8');
const identities = JSON.parse(identitiesText.slice(identitiesText.indexOf('= [') + 2, identitiesText.lastIndexOf(']') + 1));
const wanted = new Set(['1003', '1004', '1005', '1008', '1050', '1051', '1063', '1085', '1093', '2000', '2047', '2048']);
const amounts = new Map();
for (const file of [
    path.join(dir, 'FoodData_Central_sr_legacy_food_csv_2018-04/food_nutrient.csv'),
    path.join(dir, 'FoodData_Central_foundation_food_csv_2026-04-30/food_nutrient.csv'),
]) {
    for (const row of parseCsv(readFileSync(file, 'utf8'))) {
        if (!wanted.has(row.nutrient_id))
            continue;
        const key = `${row.fdc_id}:${row.nutrient_id}`;
        const current = amounts.get(key);
        const points = Number(row.data_points || 0);
        if (!current || points > current.points)
            amounts.set(key, { amount: row.amount, points });
    }
}
function readAmount(fdcId, nutrientId) {
    const found = amounts.get(`${fdcId}:${nutrientId}`);
    if (!found || found.amount === '')
        return null;
    const value = Number(found.amount);
    if (!Number.isFinite(value) || value < 0)
        return null;
    return { nutrientId: Number(nutrientId), amount: value, text: found.amount };
}
function prefer(fdcId, ids) {
    for (const id of ids) {
        const found = readAmount(fdcId, id);
        if (found)
            return found;
    }
    return null;
}
const records = identities.map(identity => {
    const sodium = prefer(identity.fdcId, ['1093']);
    const fat = prefer(identity.fdcId, ['1004', '1085']);
    const sugars = prefer(identity.fdcId, ['2000', '1063']);
    const water = prefer(identity.fdcId, ['1051']);
    const protein = prefer(identity.fdcId, ['1003']);
    const carbohydrate = prefer(identity.fdcId, ['1005', '1050']);
    const energy = prefer(identity.fdcId, ['1008', '2047', '2048']);
    return {
        identityId: identity.id,
        formula: FORMULA,
        sodiumMg: sodium?.amount ?? null,
        sodiumNutrientId: sodium?.nutrientId ?? null,
        fatG: fat?.amount ?? null,
        fatNutrientId: fat?.nutrientId ?? null,
        sugarsG: sugars?.amount ?? null,
        sugarsNutrientId: sugars?.nutrientId ?? null,
        waterG: water?.amount ?? null,
        waterNutrientId: water?.nutrientId ?? null,
        proteinG: protein?.amount ?? null,
        proteinNutrientId: protein?.nutrientId ?? null,
        carbohydrateG: carbohydrate?.amount ?? null,
        carbohydrateNutrientId: carbohydrate?.nutrientId ?? null,
        energyKcal: energy?.amount ?? null,
        energyNutrientId: energy?.nutrientId ?? null,
        saltiness: saltinessOf(sodium?.amount ?? null),
        fat: densityOf(fat?.amount ?? null),
        sweetness: densityOf(sugars?.amount ?? null),
        moisture: densityOf(water?.amount ?? null),
        reviewer: null,
        reviewStatus: 'unreviewed',
        confidence: 0,
        sourceLicense: 'CC0-1.0',
        raw: { sodium: sodium?.text ?? null, fat: fat?.text ?? null, sugars: sugars?.text ?? null, water: water?.text ?? null, protein: protein?.text ?? null, carbohydrate: carbohydrate?.text ?? null, energy: energy?.text ?? null },
    };
});
if (records.length !== identities.length)
    throw new Error('Hypothesis count drifted from identities');
const published = records.map(({ raw, ...record }) => record);
const ts = `import type { NutrientHypothesis } from '@flavorpilot/contracts/domain';
/** Generated by scripts/build-nutrient-hypotheses.mjs. Formula ${FORMULA}.
 * Scores are hypotheses from USDA nutrient density per 100 g, not taste measurements.
 * They are not inputs to the scoring engine. A missing nutrient stays null.
 */
export const nutrientHypotheses: NutrientHypothesis[] = ${JSON.stringify(published, null, 4)};
`;
writeFileSync(path.join(root, 'packages/flavor-engine/src/nutrient-hypotheses.ts'), ts);
const q = (value) => value === null || value === undefined ? 'null' : `'${String(value).replaceAll("'", "''")}'`;
const num = (value) => value === null || value === undefined ? 'null' : String(value);
const compositionColumns = 'protein_g,protein_nutrient_id,carbohydrate_g,carbohydrate_nutrient_id,energy_kcal,energy_nutrient_id';
let sql = '-- GENERATED nutrient-proxy-1 hypotheses. Not taste measurements and not scoring-engine input.\nbegin;\n';
let migration = `-- Existing databases only. Do not rerun supabase/schema.sql.
-- Published protein, carbohydrate and energy amounts for the composition reference. They do not change scoring coefficients.
begin;
alter table public.ingredient_nutrient_hypotheses
 add column if not exists protein_g numeric,
 add column if not exists protein_nutrient_id integer,
 add column if not exists carbohydrate_g numeric,
 add column if not exists carbohydrate_nutrient_id integer,
 add column if not exists energy_kcal numeric,
 add column if not exists energy_nutrient_id integer;
do $$ begin
 alter table public.ingredient_nutrient_hypotheses add constraint hypotheses_composition_amounts_nonnegative check ((protein_g is null or protein_g >= 0) and (carbohydrate_g is null or carbohydrate_g >= 0) and (energy_kcal is null or energy_kcal >= 0));
exception when duplicate_object then null; end $$;
do $$ begin
 alter table public.ingredient_nutrient_hypotheses add constraint hypotheses_protein_id_follows check ((protein_nutrient_id is null) = (protein_g is null) and (protein_nutrient_id is null or protein_nutrient_id = 1003));
exception when duplicate_object then null; end $$;
do $$ begin
 alter table public.ingredient_nutrient_hypotheses add constraint hypotheses_carbohydrate_id_follows check ((carbohydrate_nutrient_id is null) = (carbohydrate_g is null) and (carbohydrate_nutrient_id is null or carbohydrate_nutrient_id in (1005, 1050)));
exception when duplicate_object then null; end $$;
do $$ begin
 alter table public.ingredient_nutrient_hypotheses add constraint hypotheses_energy_id_follows check ((energy_nutrient_id is null) = (energy_kcal is null) and (energy_nutrient_id is null or energy_nutrient_id in (1008, 2047, 2048)));
exception when duplicate_object then null; end $$;
`;
for (const record of records) {
    const compositionValues = [num(record.raw.protein), num(record.proteinNutrientId), num(record.raw.carbohydrate), num(record.carbohydrateNutrientId), num(record.raw.energy), num(record.energyNutrientId)];
    sql += `insert into public.ingredient_nutrient_hypotheses(identity_id,formula,sodium_mg,sodium_nutrient_id,fat_g,fat_nutrient_id,sugars_g,sugars_nutrient_id,water_g,water_nutrient_id,${compositionColumns},saltiness,fat_score,sweetness,moisture,review_status,confidence,source_license) values(${[q(record.identityId), q(record.formula), num(record.raw.sodium), num(record.sodiumNutrientId), num(record.raw.fat), num(record.fatNutrientId), num(record.raw.sugars), num(record.sugarsNutrientId), num(record.raw.water), num(record.waterNutrientId), ...compositionValues, num(record.saltiness), num(record.fat), num(record.sweetness), num(record.moisture), q(record.reviewStatus), record.confidence, q(record.sourceLicense)].join(',')}) on conflict (identity_id) do update set ${compositionColumns.split(',').map((column, index) => `${column}=excluded.${column}`).join(',')} where public.ingredient_nutrient_hypotheses.review_status='unreviewed';\n`;
    migration += `update public.ingredient_nutrient_hypotheses set ${compositionColumns.split(',').map((column, index) => `${column}=${compositionValues[index]}`).join(',')} where identity_id=${q(record.identityId)} and review_status='unreviewed';\n`;
}
sql += 'commit;\n';
migration += 'commit;\n';
writeFileSync(path.join(root, 'supabase/seed-nutrient-hypotheses.sql'), sql);
writeFileSync(path.join(root, 'supabase/migrations/0007_composition_nutrients.sql'), migration);
const filled = (key) => records.filter(record => record[key] !== null).length;
console.log(`Hypotheses: ${records.length}. saltiness ${filled('saltiness')}, fat ${filled('fat')}, sweetness ${filled('sweetness')}, moisture ${filled('moisture')}, protein ${filled('proteinG')}, carbohydrate ${filled('carbohydrateG')}, energy ${filled('energyKcal')}.`);
