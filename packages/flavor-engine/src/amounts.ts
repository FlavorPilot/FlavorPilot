import type {DishItem} from '@flavorpilot/contracts/domain';

export type InputUnit = 'g' | 'piece' | 'ml';
interface AmountReference {
 unit: 'piece' | 'ml';
 gramsPerUnit: number;
 labelKey: string;
 fdcId: number;
 portionId: number;
 sourceMeasure: string;
 sourceGrams: number;
 sourceVolumeMl?: number;
}
/** USDA SR Legacy food_portion.csv (2018-04), CC0. Edible portions, not whole purchase weights.
 * Volume uses US customary fl oz/cup from NIST SP811 B.9, not a universal 1 ml = 1 g.
 * These references only convert input; they do not modify sensory coefficients. */
export const amountReferences: Readonly<Record<string,AmountReference>> = {
 egg:{unit:'piece',gramsPerUnit:50,labelKey:'largeEgg',fdcId:171287,portionId:88374,sourceMeasure:'large',sourceGrams:50},
 garlic:{unit:'piece',gramsPerUnit:3,labelKey:'garlicClove',fdcId:169230,portionId:84480,sourceMeasure:'clove',sourceGrams:3},
 lime:{unit:'piece',gramsPerUnit:67,labelKey:'limeFruit',fdcId:168155,portionId:82570,sourceMeasure:'fruit (2" dia)',sourceGrams:67},
 lemon:{unit:'piece',gramsPerUnit:58,labelKey:'peeledLemon',fdcId:167746,portionId:81883,sourceMeasure:'fruit (2-1/8" dia)',sourceGrams:58},
 avocado:{unit:'piece',gramsPerUnit:201,labelKey:'avocadoFlesh',fdcId:171705,portionId:89226,sourceMeasure:'avocado, NS as to Florida or California',sourceGrams:201},
 onion:{unit:'piece',gramsPerUnit:110,labelKey:'mediumOnion',fdcId:170000,portionId:85860,sourceMeasure:'medium (2-1/2" dia)',sourceGrams:110},
 tomato:{unit:'piece',gramsPerUnit:123,labelKey:'mediumTomato',fdcId:170457,portionId:86686,sourceMeasure:'medium whole (2-3/5" dia)',sourceGrams:123},
 banana:{unit:'piece',gramsPerUnit:118,labelKey:'peeledBanana',fdcId:173944,portionId:93515,sourceMeasure:'medium (7" to 7-7/8" long)',sourceGrams:118},
 milk:{unit:'ml',gramsPerUnit:30.5/29.57353,labelKey:'wholeMilkDensity',fdcId:171265,portionId:88315,sourceMeasure:'fl oz',sourceGrams:30.5,sourceVolumeMl:29.57353},
 olive_oil:{unit:'ml',gramsPerUnit:216/236.5882,labelKey:'oliveOilDensity',fdcId:171413,portionId:88668,sourceMeasure:'cup',sourceGrams:216,sourceVolumeMl:236.5882},
};
export const amountReference=(ingredientId:string)=>amountReferences[ingredientId];
export const supportsInputUnit=(ingredientId:string,unit:InputUnit)=>unit==='g'||amountReference(ingredientId)?.unit===unit;
const mass=(value:number)=>Math.round(value*1000)/1000;
/** Unit changes preserve exact canonical grams; never replace the current mass with a rounded display value. */
export function changeInputUnit(item:DishItem,unit:InputUnit):DishItem|null {
 if(!supportsInputUnit(item.ingredientId,unit))return null;
 const {amount:_amount,...base}=item;
 if(unit==='g')return base;
 if(item.amount?.unit===unit)return item;
 return {...base,amount:{unit,quantity:item.grams/amountReference(item.ingredientId)!.gramsPerUnit,gramsPerUnit:amountReference(item.ingredientId)!.gramsPerUnit}};
}
/** Rescale the currently declared edible mass. Manual weight corrections survive later quantity edits. */
export function changeInputQuantity(item:DishItem,quantity:number):DishItem|null {
 if(!Number.isFinite(quantity)||quantity<=0||quantity>1000000)return null;
 const grams=mass(quantity*(item.amount?.gramsPerUnit??1));
 if(!Number.isFinite(grams)||grams<=0||grams>5000)return null;
 return {...item,grams,...(item.amount?{amount:{...item.amount,quantity}}:{})};
}
