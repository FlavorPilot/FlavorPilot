import {
  dishGoalSchema,
  dishItemSchema,
  dishVisibilitySchema,
  savedDishSchema,
  type DishGoal,
  type DishItem,
  type SavedDish
} from "@tastecraft/flavor-engine";
import { z } from "zod";

const DISHES_KEY = "tastecraft:saved-dishes:v1";
const REMIX_KEY = "tastecraft:remix:v1";

const remixPayloadSchema = z.object({
  name: z.string().trim().min(1).max(160),
  items: z.array(dishItemSchema).min(1).max(24),
  goal: dishGoalSchema,
  parentDishId: z.string().trim().min(1).max(160).optional(),
  dishId: z.string().trim().min(1).max(160).optional(),
  visibility: dishVisibilitySchema.optional(),
  createdAt: z.string().datetime().optional()
});

export interface RemixPayload {
  name: string;
  items: DishItem[];
  goal: DishGoal;
  parentDishId?: string;
  dishId?: string;
  visibility?: SavedDish["visibility"];
  createdAt?: string;
}

const canUseStorage = () => {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.localStorage);
  } catch {
    return false;
  }
};

export const readSavedDishes = (): SavedDish[] => {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(DISHES_KEY);
    if (!raw) return [];
    const parsed = z.array(savedDishSchema).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
};

export const writeSavedDishes = (dishes: SavedDish[]) => {
  if (!canUseStorage()) return false;
  try {
    const parsed = z.array(savedDishSchema).parse(dishes);
    window.localStorage.setItem(DISHES_KEY, JSON.stringify(parsed));
    window.dispatchEvent(new Event("tastecraft:dishes-updated"));
    return true;
  } catch {
    return false;
  }
};

export const upsertSavedDish = (dish: SavedDish) => {
  const parsed = savedDishSchema.safeParse(dish);
  if (!parsed.success) return false;
  const current = readSavedDishes();
  const next = [parsed.data, ...current.filter((item) => item.id !== parsed.data.id)];
  return writeSavedDishes(next);
};

export const deleteSavedDish = (id: string) =>
  writeSavedDishes(readSavedDishes().filter((dish) => dish.id !== id));

export const setRemixPayload = (payload: RemixPayload) => {
  if (!canUseStorage()) return false;
  const parsed = remixPayloadSchema.safeParse(payload);
  if (!parsed.success) return false;
  try {
    window.localStorage.setItem(REMIX_KEY, JSON.stringify(parsed.data));
    return true;
  } catch {
    return false;
  }
};

export const consumeRemixPayload = (): RemixPayload | null => {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(REMIX_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(REMIX_KEY);
    const parsed = remixPayloadSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    try {
      window.localStorage.removeItem(REMIX_KEY);
    } catch {
      // Storage can become unavailable between reads; the demo can safely ignore it.
    }
    return null;
  }
};
