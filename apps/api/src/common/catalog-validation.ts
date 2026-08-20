import { BadRequestException } from "@nestjs/common";
import type { DishItem } from "@flavorpilot/contracts";
import { ingredientById, preparationById } from "@flavorpilot/flavor-engine";

/**
 * Validates references that cannot be expressed by the transport schema alone.
 * The Flavor Engine remains framework-independent; the API rejects bad catalog
 * references before calling it.
 */
export function assertValidDishItems(items: DishItem[]): void {
  const combinations = new Set<string>();

  for (const item of items) {
    const ingredient = ingredientById.get(item.ingredientId);
    if (!ingredient) {
      throw new BadRequestException({
        code: "UNKNOWN_INGREDIENT",
        message: `Unknown ingredient: ${item.ingredientId}`
      });
    }

    if (!preparationById.has(item.preparationId)) {
      throw new BadRequestException({
        code: "UNKNOWN_PREPARATION",
        message: `Unknown preparation method: ${item.preparationId}`
      });
    }

    if (!ingredient.preparations.includes(item.preparationId)) {
      throw new BadRequestException({
        code: "UNSUPPORTED_PREPARATION",
        message: `${item.preparationId} is not configured for ${item.ingredientId}`
      });
    }

    const key = `${item.ingredientId}:${item.preparationId}`;
    if (combinations.has(key)) {
      throw new BadRequestException({
        code: "DUPLICATE_DISH_ITEM",
        message: `Duplicate dish item: ${key}`
      });
    }
    combinations.add(key);
  }
}
