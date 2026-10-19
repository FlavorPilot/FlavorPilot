import { ingredients, ingredientById, preparationById, defaultDish, publicDishSeeds } from '@flavorpilot/flavor-engine';
import type { DishItem } from '@flavorpilot/contracts';
import {supportsInputUnit} from '@flavorpilot/flavor-engine';
export {amountReference,changeInputQuantity,changeInputUnit,supportsInputUnit} from '@flavorpilot/flavor-engine';
export type {InputUnit} from '@flavorpilot/flavor-engine';
export { ingredients, ingredientById, preparationById, defaultDish, publicDishSeeds };
export function validateCatalog(items: DishItem[]): boolean {
    return items.every(item => {
        const ingredient = ingredientById.get(item.ingredientId);
        return Boolean(ingredient && ingredient.preparations.includes(item.preparationId) && preparationById.has(item.preparationId) && (!item.amount||supportsInputUnit(item.ingredientId,item.amount.unit)));
    });
}
export function firstPreparation(ingredientId: string): string | undefined {
    const ingredient = ingredientById.get(ingredientId);
    return ingredient?.preparations.includes('raw') ? 'raw' : ingredient?.preparations[0];
}
