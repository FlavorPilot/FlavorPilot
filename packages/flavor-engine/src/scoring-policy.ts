import type { TextureTag } from '@flavorpilot/contracts/domain';

const firm = new Set<TextureTag>(['crisp','crunchy','firm','fibrous']);
const soft = new Set<TextureTag>(['tender','creamy','silky','juicy','flaky','sticky']);
const bounded=(value:number)=>Math.max(0,Math.min(1,value));
const firmness=(tags:TextureTag[])=>{
 const unique=[...new Set(tags)],hard=unique.filter(tag=>firm.has(tag)).length,smooth=unique.filter(tag=>soft.has(tag)).length;
 return hard+smooth===0?null:hard/(hard+smooth);
};
/** Identical mixed tag sets do not contrast with themselves. */
export function textureSeparation(left:TextureTag[],right:TextureTag[]):number {
 const a=firmness(left),b=firmness(right);
 return a===null||b===null?0:Math.abs(a-b);
}
export function preparedTextureTags(base:TextureTag[],added:TextureTag[]=[],preparationId='raw'):TextureTag[]{
 // Explicit purée replaces the original structure. A generic sauce may still be chunky.
 return [...new Set(preparationId==='pureed'?added:[...base,...added])];
}
/** Expected contrast between two mass-weighted bites, not a reward for tag/row count. */
export function textureContrastPotential(items:Array<{grams:number;textures:TextureTag[];textureIntensity:number}>):number {
 const mass=items.reduce((sum,item)=>sum+item.grams,0);
 if(mass<=0)return 0;
 let separation=0;
 for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++){
  const left=items[a],right=items[b];
  separation+=left.grams/mass*(right.grams/mass)*textureSeparation(left.textures,right.textures)*bounded(Math.max(left.textureIntensity,right.textureIntensity)/10);
 }
 // E|X-Y| <= 1/2 for i.i.d. X,Y in [0,1]. Unordered pairs need a further factor 2.
 return Math.max(0,Math.min(100,400*separation));
}
/** Keep the historic relative weights of the three composition criteria.
 * Harmonic aggregation limits compensation of a weak criterion. Contrast is descriptive,
 * not evidence of taste quality, so it has no weight in this index. Not a calibrated grade. */
export function compositionIndex(compatibility:number,balance:number,quantity:number):number {
 const components=[[compatibility,.38],[balance,.32],[quantity,.16]];
 if(components.some(([score])=>score<=0))return 0;
 const harmonic=components.reduce((sum,[,weight])=>sum+weight,0)/components.reduce((sum,[score,weight])=>sum+weight/Math.min(100,score),0);
 // Compatibility is a prerequisite: strong balance/proportions cannot hide weak pairing.
 return Math.min(compatibility,harmonic);
}
