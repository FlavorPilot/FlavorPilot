import type {DishItem} from '@flavorpilot/contracts';
import {getDictionary,formatNumber,type Locale} from '@/shared/i18n';
export function formatItemAmount(item:DishItem,locale:Locale):string {
 const t=getDictionary(locale).messages,grams=`${formatNumber(item.grams,locale,3)} ${t.grams}`;
 return item.amount?`${formatNumber(item.amount.quantity,locale,6)} ${item.amount.unit==='piece'?t.pieces:t.millilitres} (≈ ${grams})`:grams;
}
