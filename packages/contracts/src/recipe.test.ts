import { describe, expect, it } from 'vitest';
import { recipeContentSchema, MAX_RECIPE_STEPS, MAX_STEP_TEXT } from './recipe';

describe('recipe content boundaries', () => {
    it('defaults old records without requiring instructions', () => {
        expect(recipeContentSchema.parse({})).toEqual({ description: '', servings: null, steps: [] });
    });
    it('permits unfinished steps but rejects duplicate IDs and oversized text', () => {
        const step = { id: crypto.randomUUID(), text: '' };
        expect(recipeContentSchema.parse({ steps: [step] }).steps).toEqual([step]);
        expect(recipeContentSchema.safeParse({ steps: [step, step] }).success).toBe(false);
        expect(recipeContentSchema.safeParse({ steps: [{ ...step, text: 'a'.repeat(MAX_STEP_TEXT + 1) }] }).success).toBe(false);
        expect(recipeContentSchema.safeParse({ steps: Array.from({ length: MAX_RECIPE_STEPS + 1 }, () => ({ ...step, id: crypto.randomUUID() })) }).success).toBe(false);
    });
    it('requires a bounded positive whole servings value or null', () => {
        for (const servings of [0, -1, 1.5, 1001, '2', NaN, Infinity])
            expect(recipeContentSchema.safeParse({ servings }).success).toBe(false);
        expect(recipeContentSchema.parse({ servings: 2 }).servings).toBe(2);
    });
});
