const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {analyzeDish,calculatePair}=require('../../.core-test/flavor-engine/src/engine.js');
const catalog=require('../../.core-test/flavor-engine/src/ingredients.js');
const domain=require('../../.core-test/contracts/src/domain.js');
const {ingredients,ingredientById,preparationMethods,preparationById,defaultDish,publicDishSeeds,explicitPairAdjustments}=catalog;
const base=[{ingredientId:'salmon',grams:180,preparationId:'raw'},{ingredientId:'avocado',grams:90,preparationId:'raw'},{ingredientId:'mayonnaise',grams:45,preparationId:'sauce'}];
function prepared(id){const ingredient=ingredientById.get(id);return {ingredient,profile:ingredient.profile,intensity:ingredient.intensity,aromas:ingredient.aromas,textures:ingredient.textures};}
function assertAnalysis(a){
 for(const key of ['overallScore','compatibilityScore','balanceScore','quantityScore','textureScore','confidence'])assert.ok(Number.isFinite(a[key])&&a[key]>=0&&a[key]<=100,key);
 for(const v of Object.values(a.profile))assert.ok(Number.isFinite(v)&&v>=0&&v<=10);
}
test('source catalogue contains 38 ingredients, 12 methods and 64 explicit pairs',()=>{assert.equal(ingredients.length,38);assert.equal(preparationMethods.length,12);assert.equal(explicitPairAdjustments.size,64);});
test('catalogue identifiers are unique',()=>{assert.equal(ingredientById.size,38);assert.equal(preparationById.size,12);});
test('every profile is finite and every preparation reference resolves',()=>{
 for(const item of ingredients){
  assert.ok(item.name.en&&item.name.uk);assert.ok(item.share.min<=item.share.ideal&&item.share.ideal<=item.share.max);
  for(const dimension of domain.sensoryDimensions)assert.ok(Number.isFinite(item.profile[dimension])&&item.profile[dimension]>=0&&item.profile[dimension]<=10);
  assert.ok(item.preparations.length);for(const p of item.preparations)assert.ok(preparationById.has(p));
 }
});
test('source data stays equal to the recorded transcription fixture',()=>{
 const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'../catalog-baseline.json'),'utf8'));
 assert.deepEqual(ingredients,fixture.ingredients);assert.deepEqual(preparationMethods,fixture.preparations);
});
test('all curated pair endpoints exist',()=>{for(const key of explicitPairAdjustments.keys()){const [a,b]=key.split('::');assert.ok(ingredientById.has(a)&&ingredientById.has(b));}});
test('pair scoring is symmetric',()=>{for(const a of ingredients)for(const b of ingredients){assert.equal(calculatePair(prepared(a.id),prepared(b.id)).score,calculatePair(prepared(b.id),prepared(a.id)).score);}});
test('legacy qualitative pairing regression',()=>{assert.ok(calculatePair(prepared('duck'),prepared('cherry')).score>calculatePair(prepared('duck'),prepared('cucumber')).score);});
test('empty composition produces the explicit empty state',()=>{const a=analyzeDish([], 'balanced');assert.equal(a.overallScore,0);assert.equal(a.totalWeight,0);assert.equal(a.recommendations.length,0);assert.ok(a.issues.some(x=>x.code==='emptyDish'));});
test('one ingredient produces the single-ingredient marker',()=>{assert.ok(analyzeDish([base[0]],'balanced').issues.some(x=>x.code==='singleIngredient'));});
test('analysis is deterministic and does not mutate its input',()=>{const items=JSON.parse(JSON.stringify(defaultDish)),copy=JSON.stringify(items);assert.deepEqual(analyzeDish(items,'fresh'),analyzeDish(items,'fresh'));assert.equal(JSON.stringify(items),copy);});
test('default-dish source output regression is unchanged',()=>{const a=analyzeDish(defaultDish,'fresh');assert.deepEqual([a.overallScore,a.compatibilityScore,a.balanceScore,a.quantityScore,a.textureScore,a.totalWeight],[74,76,61,97,71,313]);assert.equal(a.pairResults.length,6);});
test('fatty sample flags acidity and adding the test quantity of lime improves model balance',()=>{
 const a=analyzeDish(base,'balanced'),b=analyzeDish([...base,{ingredientId:'lime',grams:14,preparationId:'raw'}],'balanced');
 assert.ok(a.issues.some(x=>x.code==='fatNeedsAcid'));assert.ok(b.balanceScore>a.balanceScore);
});
test('excess rosemary lowers quantity score in the inherited model',()=>{
 const items=[{ingredientId:'duck',grams:220,preparationId:'seared'},{ingredientId:'cherry',grams:70,preparationId:'sauce'}];
 const normal=analyzeDish([...items,{ingredientId:'rosemary',grams:1.2,preparationId:'roasted'}],'rich');
 const excess=analyzeDish([...items,{ingredientId:'rosemary',grams:35,preparationId:'roasted'}],'rich');
 assert.ok(excess.quantityScore<normal.quantityScore);
});
test.todo('CUL-001: the inherited model misses an explicit rosemary-dominance warning at 35 g; see docs/KNOWN_LIMITATIONS.md');
test('all example dishes reference supported methods',()=>{for(const d of publicDishSeeds){for(const i of d.items)assert.ok(ingredientById.get(i.ingredientId).preparations.includes(i.preparationId));assertAnalysis(analyzeDish(d.items,d.goal));}});
test('all 10 directions return finite bounded scores',()=>{for(const goal of domain.dishGoals)assertAnalysis(analyzeDish(defaultDish,goal));});
test('recommendations never duplicate an existing ingredient',()=>{const ids=new Set(defaultDish.map(x=>x.ingredientId));for(const r of analyzeDish(defaultDish,'fresh').recommendations)assert.ok(!ids.has(r.ingredientId));});
test('recommendation quantities, methods and balance delta match the actual preview',()=>{
 const before=analyzeDish(defaultDish,'fresh');
 for(const r of before.recommendations){
  const ingredient=ingredientById.get(r.ingredientId),preparationId=ingredient.preparations.includes('raw')?'raw':ingredient.preparations[0];
  assert.ok(Number.isFinite(r.recommendedGrams)&&r.recommendedGrams>0&&r.recommendedGrams<=5000);
  const after=analyzeDish([...defaultDish,{ingredientId:r.ingredientId,grams:r.recommendedGrams,preparationId}],'fresh',false);
  // Public score is rounded to an integer; the delta is derived before rounding.
  assert.ok(Math.abs((after.balanceScore-before.balanceScore)-r.balanceDelta)<=1.01);
 }
});
test('disabling recommendations keeps all primary scores identical',()=>{const a=analyzeDish(defaultDish,'fresh'),b=analyzeDish(defaultDish,'fresh',false);assert.deepEqual({...a,recommendations:[]},b);});
test('changing preparation can change the model result',()=>{const original=analyzeDish(defaultDish,'fresh'),changed=analyzeDish(defaultDish.map((v,i)=>i===0?{...v,preparationId:'smoked'}:v),'fresh');assert.notDeepEqual(original.profile,changed.profile);});
test('uniform scaling keeps the base assessment while doubling total weight',()=>{const a=analyzeDish(defaultDish,'fresh',false),b=analyzeDish(defaultDish.map(x=>({...x,grams:x.grams*2})),'fresh',false);assert.equal(b.totalWeight,2*a.totalWeight);for(const k of ['overallScore','compatibilityScore','balanceScore','quantityScore','textureScore'])assert.equal(a[k],b[k]);});
test('high but valid ingredient quantities do not produce NaN',()=>{assertAnalysis(analyzeDish(ingredients.slice(0,24).map(x=>({ingredientId:x.id,grams:5000,preparationId:x.preparations[0]}))));});
