import {describe,it,expect} from 'vitest';
import type {DishItem} from '@flavorpilot/contracts/domain';
import {dishAnalysisSchema} from '@flavorpilot/contracts';
import {analyzeDish} from './engine';
const known:DishItem[]=[{ingredientId:'salmon',grams:150,preparationId:'raw'},{ingredientId:'lime',grams:10,preparationId:'raw'}];
const inferred:DishItem[]=[{ingredientId:'milk',grams:150,preparationId:'raw'},{ingredientId:'cucumber',grams:100,preparationId:'raw'}];
export const breadedChicken:DishItem[]=[['chicken',500,'roasted'],['breadcrumb',60,'roasted'],['egg',150,'raw'],['wheat_flour',150,'raw'],['lemon_juice',54,'raw'],['salt',5,'raw'],['ketchup',150,'sauce'],['dill_pickle',120,'raw']].map(([ingredientId,grams,preparationId])=>({ingredientId:String(ingredientId),grams:Number(grams),preparationId:String(preparationId)}));
describe('restored ingredient scoring with bounded aggregation',()=>{
 it('scores profile-based pairs without requiring a manual pair rule',()=>{
  const a=analyzeDish(inferred,'balanced',false);expect(a.overallScore).toBeGreaterThan(0);expect(a.compatibilityScore).toBeGreaterThan(0);expect(a.pairResults[0]).toMatchObject({evidence:'inferred',signal:'modelled'});expect(dishAnalysisSchema.parse(a)).toEqual(a);
 });
 it('uses all pairs when an explicitly adjusted pair is mixed with inferred pairs',()=>{
  const a=analyzeDish(known,'balanced',false),b=analyzeDish([...known,{ingredientId:'egg',grams:150,preparationId:'raw'}],'balanced',false);
  expect(b.pairResults).toHaveLength(3);expect(b.pairResults.every(p=>Number.isFinite(p.score))).toBe(true);expect(b.compatibilityScore).not.toBe(a.compatibilityScore);expect(b.overallScore).toBeGreaterThan(0);
 });
 it('keeps overall/balance/proportions/texture distinct instead of replacing them with coverage',()=>{
  const a=analyzeDish(breadedChicken,'crunchy',false);expect(a.ingredientAssessment).toBeUndefined();expect(a.balanceScore).toBe(92);expect(a.quantityScore).toBe(97);expect(a.textureScore).toBe(27);expect(a.overallScore).toBeLessThanOrEqual(a.compatibilityScore);expect(a.overallScore).toBeGreaterThan(0);
 });
 it('does not let perfect balance and proportions disguise weak ingredient compatibility',()=>{
  for(const items of [breadedChicken,inferred,known])for(const goal of ['fresh','rich','crunchy'] as const){const a=analyzeDish(items,goal,false);expect(a.overallScore).toBeLessThanOrEqual(a.compatibilityScore);}
 });
 it('preserves explicit conflict hypotheses independently of the numeric profile calculation',()=>{
  const a=analyzeDish([known[0],{ingredientId:'blue_cheese',grams:30,preparationId:'raw'}],'balanced',false);expect(a.pairResults[0]).toMatchObject({evidence:'hypothesis',signal:'potentialConflict',explicitAdjustment:-18});
 });
 it('preserves scores under uniform scaling and ordering',()=>{
  const a=analyzeDish(breadedChicken,'balanced',false),b=analyzeDish([...breadedChicken].reverse().map(i=>({...i,grams:i.grams*2})),'balanced',false);for(const key of ['overallScore','compatibilityScore','balanceScore','quantityScore','textureScore'] as const)expect(b[key]).toBe(a[key]);
 });
 it('keeps historical 0.5 snapshots with null scores readable without recalculating them',()=>{
  const a=analyzeDish(inferred,'balanced',false),old={...a,overallScore:null,compatibilityScore:null,pairResults:a.pairResults.map(p=>({...p,score:null,evidence:'unknown',signal:'unknown'})),ingredientAssessment:{status:'insufficient',assessedPairs:0,totalPairs:1,weightedPercent:0,goal:'balanced',shares:[]}};expect(dishAnalysisSchema.parse(old)).toEqual(old);
 });
});
