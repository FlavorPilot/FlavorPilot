import {describe,it,expect} from 'vitest';
import {analyzeDish} from './engine';
import {catalogueById} from './scoring-catalogue';
import {amountReferences,changeInputQuantity,changeInputUnit} from './amounts';
import type {DishItem} from '@flavorpilot/contracts/domain';
const egg:DishItem={ingredientId:'egg',grams:150,preparationId:'raw'};
describe('input units without a second calculation mass',()=>{
 it('uses sourced references only for actual catalogue ingredients',()=>{
  for(const [id,ref] of Object.entries(amountReferences)){expect(catalogueById.has(id),id).toBe(true);expect(ref.gramsPerUnit).toBeGreaterThan(0);expect(ref.portionId).toBeGreaterThan(0);}
 });
 it('represents three large eggs as 150 edible grams and accepts fractional pieces',()=>{
  const pieces=changeInputUnit(egg,'piece')!;expect(pieces.amount).toEqual({unit:'piece',quantity:3,gramsPerUnit:50});
  expect(changeInputQuantity(pieces,.5)?.grams).toBe(25);
  expect(analyzeDish([pieces],'balanced',false)).toEqual(analyzeDish([egg],'balanced',false));
 });
 it('never changes canonical mass when switching units, even repeatedly',()=>{
  let item={...egg,grams:151.234};
  for(let n=0;n<50;n++){item=changeInputUnit(item,'piece')!;item=changeInputUnit(item,'g')!;}
  expect(item).toEqual({...egg,grams:151.234});
 });
 it('does not assume milk and olive oil have the same mass per ml',()=>{
  const milk=changeInputQuantity(changeInputUnit({...egg,ingredientId:'milk'},'ml')!,100)!;
  const oil=changeInputQuantity(changeInputUnit({...egg,ingredientId:'olive_oil'},'ml')!,100)!;
  expect(milk.grams).toBe(103.133);expect(oil.grams).toBe(91.298);
 });
 it('retains conversion precision across a sequence of edits and manual corrections',()=>{
  let item=changeInputUnit({...egg,ingredientId:'milk'},'ml')!;
  for(const quantity of [.1,1,10,100])item=changeInputQuantity(item,quantity)!;
  expect(item.grams).toBe(103.133);
  const corrected={...changeInputUnit(egg,'piece')!,grams:162,amount:{unit:'piece' as const,quantity:3,gramsPerUnit:54}};
  expect(changeInputQuantity(corrected,4)?.grams).toBe(216);
 });
 it('rejects unsupported units, non-finite values, zero-rounding and overflow without clamping',()=>{
  expect(changeInputUnit({...egg,ingredientId:'salmon'},'piece')).toBeNull();
  const item=changeInputUnit(egg,'piece')!;
  for(const n of [0,-1,NaN,Infinity,101,.000001])expect(changeInputQuantity(item,n)).toBeNull();
 });
});
