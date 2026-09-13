import { BadRequestException } from '@nestjs/common';
import type { DishItem } from '@flavorpilot/contracts';
import { ingredientById, preparationById } from '@flavorpilot/flavor-engine';
export function assertValidDishItems(items: DishItem[]): void {
    if (items.length > 24)
        throw new BadRequestException({ code: 'DISH_ITEM_LIMIT_REACHED', message: 'A dish can contain at most 24 ingredient/preparation rows' });
    const seen = new Set<string>();
    for (const item of items) {
        const ingredient = ingredientById.get(item.ingredientId);
        if (!ingredient || !preparationById.has(item.preparationId) || !ingredient.preparations.includes(item.preparationId))
            throw new BadRequestException({ code: 'UNSUPPORTED_DISH_ITEM', message: 'The ingredient and preparation combination is not supported' });
        const key = `${item.ingredientId}::${item.preparationId}`;
        if (seen.has(key))
            throw new BadRequestException({ code: 'DUPLICATE_DISH_ITEM', message: 'An ingredient/preparation pair cannot appear twice' });
        seen.add(key);
    }
}
