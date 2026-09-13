import { z } from 'zod';
import { savedDishSchema, dishGoalSchema, dishItemSchema, dishVisibilitySchema } from '@flavorpilot/contracts';
import { StorageError, readJson, writeJson } from '@/shared/lib/storage';
import type { Draft, Recipe } from './types';
import { canUseItems } from './types';
// Retained from v0.3.0. Never rename this key without migrating the existing recipes.
const LIBRARY_KEY = 'flavorpilot:saved-dishes:v1';
const DRAFT_KEY = 'flavorpilot:working-draft:v2';
const TRANSFER_KEY = 'flavorpilot:open-in-studio:v2';
const draftSchema = z.object({
    name: z.string().max(160), items: z.array(dishItemSchema).max(24), goal: dishGoalSchema,
    linkedId: z.string().optional(), linkedOrigin: z.enum(['local', 'cloud']).optional(),
    createdAt: z.string().datetime().optional(), parentDishId: z.string().optional(), visibility: dishVisibilitySchema,
});
function validDraft(value: unknown): Draft {
    const parsed = draftSchema.safeParse(value);
    if (!parsed.success || !canUseItems(parsed.data.items))
        throw new StorageError();
    return parsed.data;
}
export const loadWorkingDraft = (scope = 'guest'): Draft | null => { const value = readJson(`${DRAFT_KEY}:${scope}`); return value === null ? null : validDraft(value); };
export const saveWorkingDraft = (draft: Draft, scope = 'guest') => { writeJson(`${DRAFT_KEY}:${scope}`, validDraft(draft)); };
export function localRecipes(): Recipe[] {
    const value = readJson(LIBRARY_KEY);
    if (value === null)
        return [];
    const result = savedDishSchema.array().safeParse(value);
    if (!result.success || result.data.some(dish => !canUseItems(dish.items)))
        throw new StorageError();
    return result.data.map(dish => ({ ...dish, origin: 'local' as const }));
}
export function saveLocalRecipe(draft: Draft): Recipe {
    const current = localRecipes(); // Invalid old content blocks writes; it is never silently erased.
    const id = draft.linkedOrigin === 'local' && draft.linkedId ? draft.linkedId : crypto.randomUUID();
    const updatesPrivate = current.some(dish => dish.id === id && dish.visibility === 'private');
    if (!updatesPrivate && current.filter(dish => dish.id !== id && dish.visibility === 'private').length >= 3)
        throw new Error('FREE_PRIVATE_DISH_LIMIT_REACHED');
    const parsed = savedDishSchema.parse({ id, name: draft.name.trim(), items: draft.items, goal: draft.goal,
        visibility: 'private', createdAt: draft.linkedOrigin === 'local' && draft.createdAt ? draft.createdAt : new Date().toISOString(),
        ...(draft.parentDishId ? { parentDishId: draft.parentDishId } : {}) });
    const next = [parsed, ...current.filter(dish => dish.id !== id).map(({ origin: _origin, ...rest }) => rest)];
    writeJson(LIBRARY_KEY, next);
    window.dispatchEvent(new Event('flavorpilot:dishes-updated'));
    return { ...parsed, origin: 'local' };
}
export function deleteLocalRecipe(id: string) {
    const next = localRecipes().filter(dish => dish.id !== id).map(({ origin: _origin, ...rest }) => rest);
    writeJson(LIBRARY_KEY, next);
    window.dispatchEvent(new Event('flavorpilot:dishes-updated'));
}
export function openRecipeDraft(recipe: Recipe, mode: 'edit' | 'remix', scope = 'guest'): void {
    const draft: Draft = { name: recipe.name, items: recipe.items, goal: recipe.goal,
        visibility: mode === 'remix' ? 'private' : recipe.visibility,
        ...(mode === 'edit' && recipe.origin !== 'example' ? { linkedId: recipe.id, linkedOrigin: recipe.origin, createdAt: recipe.createdAt } : {}),
        ...(mode === 'remix' && recipe.origin === 'cloud' ? { parentDishId: recipe.id } : recipe.parentDishId ? { parentDishId: recipe.parentDishId } : {}),
    };
    // Do not consume during the first StrictMode effect and then lose it on the second mount.
    writeJson(`${TRANSFER_KEY}:${scope}`, { draft, nonce: crypto.randomUUID() });
}
export function takeStudioTransfer(scope = 'guest'): Draft | null {
    const value = readJson(`${TRANSFER_KEY}:${scope}`);
    if (value === null)
        return null;
    const parsed = z.object({ draft: draftSchema, nonce: z.string() }).safeParse(value);
    if (!parsed.success)
        throw new StorageError();
    const draft = validDraft(parsed.data.draft);
    saveWorkingDraft(draft, scope); // Commit working copy BEFORE removing transfer.
    window.localStorage.removeItem(`${TRANSFER_KEY}:${scope}`);
    return draft;
}
export function recipeExport(draft: Draft) {
    return { format: 'flavorpilot.recipe', version: 1, name: draft.name.trim() || 'Untitled dish', items: draft.items, goal: draft.goal };
}
export function importRecipe(value: unknown): Draft {
    const parsed = z.object({ name: z.string().trim().min(1).max(160), items: z.array(dishItemSchema).min(1).max(24), goal: dishGoalSchema }).parse(value);
    const draft: Draft = { ...parsed, visibility: 'private' };
    if (!canUseItems(draft.items))
        throw new Error('INVALID_RECIPE');
    return draft; // Never import identities, ownership, visibility or subscription claims.
}
