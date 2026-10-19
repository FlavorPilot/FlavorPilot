import type { DishGoal, DishItem, DishVisibility, RecipeContent } from '@flavorpilot/contracts';
import {supportsInputUnit} from '@flavorpilot/flavor-engine';
export type RecipeOrigin = 'local' | 'cloud' | 'example';
export interface Recipe extends RecipeContent {
    id: string;
    name: string;
    items: DishItem[];
    goal: DishGoal;
    visibility: DishVisibility;
    createdAt: string;
    origin: RecipeOrigin;
    parentDishId?: string;
    author?: string;
    shareToken?: string;
    ownerId?: string;
    versionNumber?: number;
    moderationHidden?: boolean;
}
export interface Draft extends RecipeContent {
    name: string;
    items: DishItem[];
    goal: DishGoal;
    linkedId?: string;
    linkedOrigin?: 'local' | 'cloud';
    linkedVersionNumber?: number;
    createdAt?: string;
    parentDishId?: string;
    visibility: DishVisibility;
}
export const MAX_ITEMS = 24;
export const emptyRecipeContent = (): RecipeContent => ({ description: '', servings: null, steps: [] });
export const emptyDraft = (): Draft => ({ name: '', items: [], goal: 'balanced', visibility: 'private', ...emptyRecipeContent() });
export const hasDraftContent = (draft: Draft): boolean => Boolean(draft.name.trim() || draft.items.length || draft.description.trim() || draft.steps.length || draft.servings !== null);
export const fingerprint = (draft: Draft): string => JSON.stringify(draft);
export const itemKey = (item: DishItem): string => `${item.ingredientId}::${item.preparationId}`;
export function parseAmount(value: string,maximum=5000): number | null {
    const normalized = value.trim().replace(',', '.');
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized))
        return null;
    const number = Number(normalized);
    return Number.isFinite(number) && number > 0 && number <= maximum ? number : null;
}
export function canUseItems(items: DishItem[]): boolean {
    return items.length <= MAX_ITEMS && items.every(item => Number.isFinite(item.grams) && item.grams > 0 && item.grams <= 5000 && (!item.amount||(Number.isFinite(item.amount.quantity)&&item.amount.quantity>0&&item.amount.quantity<=1000000&&Number.isFinite(item.amount.gramsPerUnit)&&item.amount.gramsPerUnit>0&&item.amount.gramsPerUnit<=1000000000&&Math.abs(item.grams-Math.round(item.amount.quantity*item.amount.gramsPerUnit*1000)/1000)<0.000501&&supportsInputUnit(item.ingredientId,item.amount.unit))))
        && new Set(items.map(itemKey)).size === items.length;
}
