import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {ingredients,preparationMethods,explicitPairAdjustments}=require('../packages/flavor-engine/dist/ingredients.js');
const q=v=>`'${String(v).replaceAll("'","''")}'`;
const arr=v=>v.length?`array[${v.map(q).join(',')}]::text[]`:`'{}'::text[]`;
const json=v=>q(JSON.stringify(v))+'::jsonb';
const note='Imported demo hypotheses from FlavorPilot 78c1a53. Unverified; no scientific confidence is implied.';
let sql='-- GENERATED demo catalogue. Run on a fresh/dev database or review the diff first.\n-- Does NOT overwrite reviewed ingredient records. It is not a recipe safety dataset.\nbegin;\n';
for(const p of preparationMethods)sql+=`insert into public.preparation_methods(id,name_en,name_uk,profile_multiplier,intensity_multiplier,add_aromas,add_textures) values(${[q(p.id),q(p.name.en),q(p.name.uk),json(p.profileMultiplier),p.intensityMultiplier,arr(p.addAromas??[]),arr(p.addTextures??[])].join(',')}) on conflict (id) do nothing;\n`;
for(const i of ingredients)sql+=`insert into public.ingredients(id,name_en,name_uk,category_en,category_uk,sensory_profile,intensity,texture_intensity,aromas,textures,roles,min_share,ideal_share,max_share,preparation_ids,source_note,confidence) values(${[q(i.id),q(i.name.en),q(i.name.uk),q(i.category.en),q(i.category.uk),json(i.profile),i.intensity,i.textureIntensity,arr(i.aromas),arr(i.textures),arr(i.roles),i.share.min,i.share.ideal,i.share.max,arr(i.preparations),q(note),0].join(',')}) on conflict (id) do nothing;\n`;
for(const [key,value] of explicitPairAdjustments){const [a,b]=key.split('::');sql+=`insert into public.ingredient_pairings(ingredient_a_id,ingredient_b_id,explicit_adjustment,source_note,confidence) values(${q(a)},${q(b)},${value},${q(note)},0) on conflict (ingredient_a_id,ingredient_b_id) do nothing;\n`;}
sql+='commit;\n';writeFileSync(new URL('../supabase/seed.sql',import.meta.url),sql);console.log(`Seed: ${ingredients.length} ingredients, ${preparationMethods.length} preparations, ${explicitPairAdjustments.size} pairs.`);
