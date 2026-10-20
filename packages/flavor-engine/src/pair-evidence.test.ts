import {describe,it,expect} from 'vitest';
import type {DishItem} from '@flavorpilot/contracts/domain';
import {dishAnalysisSchema} from '@flavorpilot/contracts';
import {analyzeDish} from './engine';
import {explicitPairAdjustments} from './ingredients';
const known:DishItem[]=[{ingredientId:'salmon',grams:150,preparationId:'raw'},{ingredientId:'lime',grams:10,preparationId:'raw'}];
const unknown:DishItem[]=[{ingredientId:'milk',grams:150,preparationId:'raw'},{ingredientId:'cucumber',grams:100,preparationId:'raw'}];
export const breadedChicken:DishItem[]=[['chicken',500,'roasted'],['breadcrumb',60,'roasted'],['egg',150,'raw'],['wheat_flour',150,'raw'],['lemon_juice',54,'raw'],['salt',5,'raw'],['ketchup',150,'sauce'],['dill_pickle',120,'raw']].map(([ingredientId,grams,preparationId])=>({ingredientId:String(ingredientId),grams:Number(grams),preparationId:String(preparationId)}));
describe('ingredient evidence rather than a finished-dish grade',()=>{
 it('leaves unknown pairs and an unsupported index null instead of assigning a neutral or bad score',()=>{
  const a=analyzeDish(unknown,'balanced',false);
  expect(a.overallScore).toBeNull();expect(a.compatibilityScore).toBeNull();expect(a.pairResults[0]).toMatchObject({score:null,evidence:'unknown',signal:'unknown'});
  expect(a.ingredientAssessment).toMatchObject({status:'insufficient',assessedPairs:0,totalPairs:1,weightedPercent:0});
  expect(dishAnalysisSchema.parse(a)).toEqual(a);
  expect(dishAnalysisSchema.safeParse({...a,overallScore:50}).success).toBe(false);
 });
 it('shows an index only for full pair coverage and never raises it through profile fit or catalogue proportions',()=>{
  const a=analyzeDish(known,'fresh',false),b=analyzeDish(known,'rich',false);
  expect(a.overallScore).toBe(a.compatibilityScore);expect(a.overallScore).not.toBeNull();expect(a.overallScore).toBe(b.overallScore);
  expect(a.balanceScore).not.toBe(b.balanceScore);expect(a.ingredientAssessment?.status).toBe('complete');
 });
 it('does not dilute or reward an assessed pair when unrelated unknown pairs are added',()=>{
  const a=analyzeDish(known,'balanced',false),b=analyzeDish([...known,{ingredientId:'egg',grams:150,preparationId:'raw'}],'balanced',false);
  expect(b.compatibilityScore).toBe(a.compatibilityScore);expect(b.overallScore).toBeNull();
  expect(b.ingredientAssessment).toMatchObject({status:'partial',assessedPairs:1,totalPairs:3});
  expect(b.ingredientAssessment!.weightedPercent).toBeGreaterThan(0);expect(b.ingredientAssessment!.weightedPercent).toBeLessThan(100);
 });
 it('distinguishes an explicitly neutral zero rule from absence, without rewriting catalogue data',()=>{
  const key='cucumber::milk',previous=explicitPairAdjustments.get(key);
  try{explicitPairAdjustments.set(key,0);const a=analyzeDish(unknown,'balanced',false);expect(a.pairResults[0]).toMatchObject({evidence:'hypothesis',signal:'neutral'});expect(a.overallScore).not.toBeNull();}
  finally{if(previous===undefined)explicitPairAdjustments.delete(key);else explicitPairAdjustments.set(key,previous);}
 });
 it('exposes authored conflict hypotheses independently of general numerical similarity',()=>{
  const a=analyzeDish([{...known[0]},{ingredientId:'blue_cheese',grams:30,preparationId:'raw'}],'balanced',false);
  expect(a.pairResults[0]).toMatchObject({evidence:'hypothesis',signal:'potentialConflict',explicitAdjustment:-18});
 });
 it('handles the reported breaded composition without inventing panading, an index or proportion approval',()=>{
  const a=analyzeDish(breadedChicken,'crunchy',false);
  expect(a.overallScore).toBeNull();expect(a.compatibilityScore).toBeNull();expect(a.ingredientAssessment).toMatchObject({totalPairs:28,assessedPairs:0,status:'insufficient',goal:'crunchy'});
  expect(a.pairResults.every(p=>p.score===null)).toBe(true);expect(a.balanceScore).toBe(92);expect(a.textureScore).toBe(27);
  expect(a.ingredientAssessment?.shares.find(s=>s.ingredientId==='wheat_flour')).toMatchObject({grams:150,percent:12.62});
 });
 it('preserves coverage and index under uniform scaling and ordering; recipe format is not inferred',()=>{
  const a=analyzeDish(known,'balanced',false),b=analyzeDish([...known].reverse().map(i=>({...i,grams:i.grams*4})),'balanced',false);
  expect(b.overallScore).toBe(a.overallScore);expect(b.ingredientAssessment?.weightedPercent).toBe(a.ingredientAssessment?.weightedPercent);
 });
});
