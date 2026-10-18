/** Compare every published amount and identity against the official CSV files, offline. */
import { createRequire } from 'node:module';
import path from 'node:path';
import assert from 'node:assert/strict';
import { readCsv } from './lib/fdc-csv.mjs';
const require = createRequire(import.meta.url);
const { sourcedIdentities, nutrientHypotheses } = require('../packages/flavor-engine/dist/index.js');
const dir = process.env.FDC_DIR ?? '.local/fdc';
const wanted = new Set(sourcedIdentities.map(x=>String(x.fdcId)));
const foods = new Map(), amounts = new Map();
for (const dataset of ['FoodData_Central_foundation_food_csv_2026-04-30','FoodData_Central_sr_legacy_food_csv_2018-04']) {
  for (const row of readCsv(path.join(dir,dataset,'food.csv'))) if(wanted.has(row.fdc_id)) foods.set(row.fdc_id,row);
  for (const row of readCsv(path.join(dir,dataset,'food_nutrient.csv'))) if(wanted.has(row.fdc_id)) {
    const key = `${row.fdc_id}:${row.nutrient_id}`;
    const current = amounts.get(key);
    if (!current || Number(row.data_points || 0) > Number(current.data_points || 0)) amounts.set(key,row);
  }
}
const nutrients = new Map(nutrientHypotheses.map(x=>[x.identityId,x]));
const fields = [['sodiumMg','sodiumNutrientId',['1093']],['fatG','fatNutrientId',['1004','1085']],['sugarsG','sugarsNutrientId',['2000','1063']],['waterG','waterNutrientId',['1051']],['proteinG','proteinNutrientId',['1003']],['carbohydrateG','carbohydrateNutrientId',['1005','1050']],['energyKcal','energyNutrientId',['1008','2047','2048']]];
for (const identity of sourcedIdentities) {
  assert.equal(identity.fdcDescription,foods.get(String(identity.fdcId))?.description,identity.id);
  const row = nutrients.get(identity.id);
  for (const [field,idField,choices] of fields) {
    const source = choices.map(id=>amounts.get(`${identity.fdcId}:${id}`)).find(x=>x && x.amount!=='' && Number.isFinite(Number(x.amount)) && Number(x.amount)>=0);
    assert.equal(row[field],source ? Number(source.amount) : null,`${identity.id}.${field}`);
    assert.equal(row[idField],source ? Number(source.nutrient_id) : null,`${identity.id}.${idField}`);
  }
}
console.log(`Verified ${sourcedIdentities.length} exact food descriptions and ${sourcedIdentities.length*fields.length} published amount/missing-value pairs against USDA CSV.`);
