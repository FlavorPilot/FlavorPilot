import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const {
  ingredients,
  preparationMethods,
  explicitPairAdjustments
} = require("../packages/flavor-engine/dist/ingredients.js");

const sourceNote = "MVP expert seed; validate with culinary reviewers";
const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;
const jsonb = (value) => `${sqlString(JSON.stringify(value))}::jsonb`;
const textArray = (values) =>
  values.length === 0
    ? "'{}'::text[]"
    : `array[${values.map(sqlString).join(", ")}]::text[]`;
const number = (value) => String(Number(value));

const preparationRows = preparationMethods.map((preparation) =>
  [
    sqlString(preparation.id),
    sqlString(preparation.name.en),
    sqlString(preparation.name.uk),
    jsonb(preparation.profileMultiplier),
    number(preparation.intensityMultiplier),
    textArray(preparation.addAromas ?? []),
    textArray(preparation.addTextures ?? [])
  ].join(", ")
);

const ingredientRows = ingredients.map((ingredient) =>
  [
    sqlString(ingredient.id),
    sqlString(ingredient.name.en),
    sqlString(ingredient.name.uk),
    sqlString(ingredient.category.en),
    sqlString(ingredient.category.uk),
    jsonb(ingredient.profile),
    number(ingredient.intensity),
    number(ingredient.textureIntensity),
    textArray(ingredient.aromas),
    textArray(ingredient.textures),
    textArray(ingredient.roles),
    number(ingredient.share.min),
    number(ingredient.share.ideal),
    number(ingredient.share.max),
    textArray(ingredient.preparations),
    sqlString(sourceNote),
    "0.55"
  ].join(", ")
);

const pairingRows = [...explicitPairAdjustments.entries()].map(([key, adjustment]) => {
  const [ingredientAId, ingredientBId] = key.split("::");
  return [
    sqlString(ingredientAId),
    sqlString(ingredientBId),
    number(adjustment),
    "0.55",
    sqlString(sourceNote)
  ].join(", ");
});

const values = (rows) => rows.map((row) => `  (${row})`).join(",\n");

const output = `-- Generated from packages/flavor-engine/src/ingredients.ts.
-- Demo values are hypotheses and require independent culinary validation.

insert into public.preparation_methods (id, name_en, name_uk, profile_multiplier, intensity_multiplier, add_aromas, add_textures) values
${values(preparationRows)}
on conflict (id) do update set
  name_en = excluded.name_en,
  name_uk = excluded.name_uk,
  profile_multiplier = excluded.profile_multiplier,
  intensity_multiplier = excluded.intensity_multiplier,
  add_aromas = excluded.add_aromas,
  add_textures = excluded.add_textures;

insert into public.ingredients (
  id, name_en, name_uk, category_en, category_uk, sensory_profile,
  intensity, texture_intensity, aromas, textures, roles,
  min_share, ideal_share, max_share, preparation_ids,
  source_note, confidence
) values
${values(ingredientRows)}
on conflict (id) do update set
  name_en = excluded.name_en,
  name_uk = excluded.name_uk,
  category_en = excluded.category_en,
  category_uk = excluded.category_uk,
  sensory_profile = excluded.sensory_profile,
  intensity = excluded.intensity,
  texture_intensity = excluded.texture_intensity,
  aromas = excluded.aromas,
  textures = excluded.textures,
  roles = excluded.roles,
  min_share = excluded.min_share,
  ideal_share = excluded.ideal_share,
  max_share = excluded.max_share,
  preparation_ids = excluded.preparation_ids,
  source_note = excluded.source_note,
  confidence = excluded.confidence;

insert into public.ingredient_pairings (
  ingredient_a_id, ingredient_b_id, explicit_adjustment, confidence, source_note
) values
${values(pairingRows)}
on conflict (ingredient_a_id, ingredient_b_id) do update set
  explicit_adjustment = excluded.explicit_adjustment,
  confidence = excluded.confidence,
  source_note = excluded.source_note;
`;

const outputPath = resolve(process.cwd(), "supabase/seed.sql");
writeFileSync(outputPath, output, "utf8");
console.log(
  `Wrote ${outputPath} (${ingredients.length} ingredients, ${preparationMethods.length} preparations, ${pairingRows.length} pairings).`
);
