import {describe,it,expect} from 'vitest';
import type {DishItem,TextureTag} from '@flavorpilot/contracts/domain';
import {analyzeDish,calculatePair} from './engine';
import {catalogueById} from './scoring-catalogue';
import {compositionIndex,preparedTextureTags,textureContrastPotential,textureSeparation} from './scoring-policy';

const soft=(grams:number)=>({grams,textures:['creamy'] as TextureTag[],textureIntensity:10});
const crisp=(grams:number)=>({grams,textures:['crisp'] as TextureTag[],textureIntensity:10});
export const partialScreenshot:DishItem[]=[['milk',150,'raw'],['cucumber',100,'raw'],['lemon',8.8,'raw'],['lime',8.3,'raw'],['avocado',48,'raw'],['cilantro',5.7,'raw'],['ginger',5.8,'raw'],['miso',9.1,'fermented'],['sesame',7.4,'raw']].map(([ingredientId,grams,preparationId])=>({ingredientId:String(ingredientId),grams:Number(grams),preparationId:String(preparationId)}));

describe('mass-weighted descriptive texture potential',()=>{
 it('has no base/tag-count bonus for empty, single or identical mixed textures',()=>{
  expect(textureContrastPotential([])).toBe(0);expect(textureContrastPotential([soft(100)])).toBe(0);
  const mixed={grams:100,textures:['crisp','juicy'] as TextureTag[],textureIntensity:10};
  expect(textureSeparation(mixed.textures,mixed.textures)).toBe(0);
  expect(textureContrastPotential(Array.from({length:24},()=>({...mixed})))).toBe(0);
  expect(textureContrastPotential(Array.from({length:24},()=>soft(100)))).toBe(0);
 });
 it('normalizes the theoretical maximum and makes a trace portion a trace contribution',()=>{
  expect(textureContrastPotential([soft(100),crisp(100)])).toBe(100);
  expect(textureContrastPotential([soft(90),crisp(10)])).toBeCloseTo(36);
  expect(textureContrastPotential([soft(100),crisp(.1)])).toBeLessThan(.4);
  const manyTrace=[soft(1000),...Array.from({length:23},()=>crisp(.1))];
  expect(textureContrastPotential(manyTrace)).toBeLessThan(1);
 });
 it('is invariant to row splitting, ordering and uniform scaling',()=>{
  const base=[soft(100),crisp(20)];
  expect(textureContrastPotential([soft(40),crisp(20),soft(60)])).toBeCloseTo(textureContrastPotential(base));
  expect(textureContrastPotential([...base].reverse())).toBeCloseTo(textureContrastPotential(base));
  expect(textureContrastPotential(base.map(i=>({...i,grams:i.grams*7})))).toBeCloseTo(textureContrastPotential(base));
 });
 it('uses the existing intensity scale instead of treating all tags as equally perceptible',()=>{
  expect(textureContrastPotential([{...soft(100),textureIntensity:2},{...crisp(100),textureIntensity:3}])).toBeCloseTo(30);
 });
 it('replaces original structure only for explicit purée, not a generic sauce',()=>{
  expect(preparedTextureTags(['crisp','juicy'],['silky','creamy'],'pureed')).toEqual(['silky','creamy']);
  expect(preparedTextureTags(['crunchy'],['silky'],'sauce')).toContain('crunchy');
  const raw=analyzeDish([{ingredientId:'milk',grams:150,preparationId:'raw'},{ingredientId:'cucumber',grams:100,preparationId:'raw'}],'balanced',false);
  const puree=analyzeDish([{ingredientId:'milk',grams:150,preparationId:'raw'},{ingredientId:'cucumber',grams:100,preparationId:'pureed'}],'balanced',false);
  expect(raw.textureScore).toBeGreaterThan(0);expect(puree.textureScore).toBe(0);
  expect(puree.issues.some(i=>i.code==='flatTexture')).toBe(false);
 });
 it('reproduces the visible nine rows without the old saturation at five ingredients',()=>{
  const a=analyzeDish(partialScreenshot,'balanced',false);
  expect(a.textureScore).toBe(36);expect(a.overallScore).toBe(a.compatibilityScore);
  expect(a.issues.some(i=>i.code==='flatTexture')).toBe(false);
  const scaled=analyzeDish(partialScreenshot.map(i=>({...i,grams:i.grams*2})),'balanced',false);
  expect(scaled.textureScore).toBe(a.textureScore);
 });
});

describe('composition aggregation without a texture-quality bonus',()=>{
 it('retains an equal criterion value and bounded zero/all-perfect cases',()=>{
  expect(compositionIndex(80,80,80)).toBeCloseTo(80);expect(compositionIndex(100,100,100)).toBeCloseTo(100);
  expect(compositionIndex(0,100,100)).toBe(0);
 });
 it('does not give compatibility an indirect texture bonus either',()=>{
  const prepare=(id:string,textures:TextureTag[])=>{const ingredient=catalogueById.get(id)!;return {ingredient,profile:ingredient.profile,intensity:ingredient.intensity,aromas:ingredient.aromas,textures};};
  expect(calculatePair(prepare('milk',['silky']),prepare('cucumber',['crisp']))).toEqual(calculatePair(prepare('milk',['silky']),prepare('cucumber',['silky'])));
 });
 it('limits compensation of weak compatibility by perfect balance/proportions',()=>{
  expect(compositionIndex(20,100,100)).toBe(20);
  expect(compositionIndex(62,100,100)).toBe(62);
  expect(compositionIndex(62,91,90)).toBe(62);
  expect(compositionIndex(40,100,100)).toBeGreaterThan(compositionIndex(20,100,100));
 });
 it('does not increase heuristic confidence just by adding unknown ingredient pairs',()=>{
  const a=analyzeDish(partialScreenshot.slice(0,2),'balanced',false);
  expect(a.confidence).toBe(55);
  // The first four rows have no explicit pair adjustments, irrespective of their count.
  expect(analyzeDish(partialScreenshot.slice(0,4),'balanced',false).confidence).toBe(a.confidence);
 });
});
