const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {analyzeDish,calculatePair}=require('../../.core-test/flavor-engine/src/engine.js');
const catalog=require('../../.core-test/flavor-engine/src/ingredients.js');
const knowledge=require('../../.core-test/flavor-engine/src/knowledge.js');
const identities=require('../../.core-test/flavor-engine/src/sourced-identities.js');
const hypotheses=require('../../.core-test/flavor-engine/src/nutrient-hypotheses.js');
const nutrientFormula=require('../../.core-test/flavor-engine/src/nutrient-hypothesis.js');
const scoring=require('../../.core-test/flavor-engine/src/scoring-catalogue.js');
const domain=require('../../.core-test/contracts/src/domain.js');
const {ingredients,ingredientById,preparationMethods,preparationById,defaultDish,publicDishSeeds,explicitPairAdjustments}=catalog;
const base=[{ingredientId:'salmon',grams:180,preparationId:'raw'},{ingredientId:'avocado',grams:90,preparationId:'raw'},{ingredientId:'mayonnaise',grams:45,preparationId:'sauce'}];
function prepared(id){const ingredient=ingredientById.get(id);return {ingredient,profile:ingredient.profile,intensity:ingredient.intensity,aromas:ingredient.aromas,textures:ingredient.textures};}
function assertAnalysis(a){
 for(const key of ['overallScore','compatibilityScore','balanceScore','quantityScore','textureScore','confidence'])assert.ok(Number.isFinite(a[key])&&a[key]>=0&&a[key]<=100,key);
 for(const v of Object.values(a.profile))assert.ok(Number.isFinite(v)&&v>=0&&v<=10);
}
test('source catalogue contains 38 ingredients, 12 methods and 64 explicit pairs',()=>{assert.equal(ingredients.length,38);assert.equal(preparationMethods.length,12);assert.equal(explicitPairAdjustments.size,64);});
test('knowledge rows stay unreviewed hypotheses until a person records a source',()=>{
 const coverage=knowledge.knowledgeCoverage();
 assert.equal(coverage.ingredients,38);assert.equal(coverage.preparations,12);assert.equal(coverage.pairings,64);
 assert.equal(coverage.reviewedIngredients,0);assert.equal(coverage.reviewedPreparations,0);assert.equal(coverage.reviewedPairings,0);
 assert.equal(coverage.sourcedIdentities,119);assert.equal(coverage.reviewedSourcedIdentities,0);
 assert.equal(coverage.nutrientHypotheses,119);assert.equal(coverage.reviewedNutrientHypotheses,0);
 assert.equal(coverage.scoringIngredients,120);
 assert.deepEqual(coverage.alphaTarget,{min:80,max:120});assert.deepEqual(coverage.releaseTarget,{min:300,max:500});
 assert.equal(knowledge.isReviewedRecordComplete({source:'x',sourceLicense:null,reviewer:null,reviewStatus:'reviewed',confidence:1,modelVersion:'0.3.0-hypothesis',lastReviewedAt:null}),false);
});
test('USDA identity rows cite a public-domain record and leave the sensory model empty',()=>{
 const rows=identities.sourcedIdentities;
 const engineIds=new Set(ingredients.map(item=>item.id));
 assert.equal(rows.length,119);
 assert.equal(new Set(rows.map(row=>row.fdcId)).size,rows.length);
 assert.equal(rows.some(row=>row.id==='rice_vinegar'),false);
 for(const row of rows){
  assert.equal(row.reviewStatus,'unreviewed');assert.equal(row.reviewer,null);assert.equal(row.confidence,0);
  assert.equal(row.sensoryProfile,null);assert.equal(row.preparationEffects,null);assert.equal(row.recommendedRange,null);assert.equal(row.pairingEvidence,null);
  assert.equal(row.sourceLicense,'CC0-1.0');assert.equal(row.nameUkOrigin,'project-translation');
  assert.ok(row.source.includes('FoodData Central'));assert.ok(row.sourceUrl.endsWith(`/${row.fdcId}/nutrients`));
  assert.ok(row.fdcDescription.length>1);
  if(row.catalogIngredientId)assert.ok(engineIds.has(row.catalogIngredientId));
 }
});
test('nutrient hypotheses recompute from stored USDA amounts',()=>{
 const rows=hypotheses.nutrientHypotheses;
 assert.equal(rows.length,119);assert.equal(ingredients.length,38);
 for(const row of rows){
  assert.equal(row.reviewStatus,'unreviewed');assert.equal(row.confidence,0);assert.equal(row.formula,'nutrient-proxy-1');
  assert.equal(row.saltiness,nutrientFormula.hypothesisSaltiness(row.sodiumMg));
  assert.equal(row.fat,nutrientFormula.hypothesisDensity(row.fatG));
  assert.equal(row.sweetness,nutrientFormula.hypothesisDensity(row.sugarsG));
  assert.equal(row.moisture,nutrientFormula.hypothesisDensity(row.waterG));
 }
 const salt=rows.find(row=>row.identityId==='salt');
 const honey=rows.find(row=>row.identityId==='honey');
 const oil=rows.find(row=>row.identityId==='olive_oil');
 assert.ok(salt.saltiness>9);assert.equal(salt.fat,null);
 assert.ok(honey.sweetness>8);
 assert.equal(oil.fatNutrientId,1085);assert.ok(oil.fat>9);
});
test('USDA foods that are not in the transcribed 38 change the dish score',()=>{
 assert.equal(scoring.hypothesisIngredients.length,82);
 assert.equal(scoring.catalogueIngredients.length,120);
 const plain=analyzeDish([{ingredientId:'salmon',grams:180,preparationId:'raw'}],'balanced',false);
 const salted=analyzeDish([{ingredientId:'salmon',grams:180,preparationId:'raw'},{ingredientId:'salt',grams:4,preparationId:'raw'}],'balanced',false);
 assert.ok(salted.profile.saltiness>plain.profile.saltiness);
 assert.notEqual(salted.overallScore,plain.overallScore);
 const beef=scoring.hypothesisIngredients.find(item=>item.id==='beef');
 const onion=scoring.hypothesisIngredients.find(item=>item.id==='onion');
 assert.ok(beef.profile.umami>5&&beef.profile.fat>2);
 assert.ok(onion.profile.pungency>3);
 for(const item of scoring.hypothesisIngredients){
  assert.equal(item.scoredDimensions,undefined);
  assert.ok(item.preparations.includes('raw'));
  for(const dimension of domain.sensoryDimensions)assert.ok(item.profile[dimension]>=0&&item.profile[dimension]<=10);
  for(const preparation of item.preparations)assert.ok(preparationById.has(preparation));
 }
});
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
test('default-dish source output regression is unchanged',()=>{const a=analyzeDish(defaultDish,'fresh');assert.deepEqual([a.overallScore,a.compatibilityScore,a.balanceScore,a.quantityScore,a.textureScore,a.totalWeight],[74,76,61,97,71,313]);assert.equal(a.pairResults.length,6);assert.equal(a.issues.some(issue=>issue.code==='outsideRecommendedRange'),false);});
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
test('CUL-001: excess rosemary warns about its working range while duck can remain the higher-impact ingredient',()=>{
 const items=[{ingredientId:'duck',grams:220,preparationId:'seared'},{ingredientId:'cherry',grams:70,preparationId:'sauce'}];
 const normal=analyzeDish([...items,{ingredientId:'rosemary',grams:1.2,preparationId:'roasted'}],'rich');
 const excess=analyzeDish([...items,{ingredientId:'rosemary',grams:35,preparationId:'roasted'}],'rich');
 assert.ok(excess.quantityScore<normal.quantityScore);
 const firstWarning=excess.issues.find(issue=>issue.severity==='warning');
 assert.equal(firstWarning.code,'outsideRecommendedRange');assert.equal(firstWarning.ingredientId,'rosemary');
 assert.notEqual(excess.dominantIngredientId,'rosemary');
 assert.equal(normal.issues.some(issue=>issue.code==='outsideRecommendedRange'&&issue.ingredientId==='rosemary'),false);
});
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
