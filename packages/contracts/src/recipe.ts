import { z } from 'zod';

export const MAX_RECIPE_STEPS = 40;
export const MAX_STEP_TEXT = 4000;
export const MAX_RECIPE_DESCRIPTION = 4000;
export const MAX_RECIPE_SERVINGS = 1000;
export const recipeStepSchema = z.object({ id: z.string().uuid(), text: z.string().max(MAX_STEP_TEXT) });
export const recipeContentSchema = z.object({
    description: z.string().max(MAX_RECIPE_DESCRIPTION).default(''),
    servings: z.number().int().positive().max(MAX_RECIPE_SERVINGS).nullable().default(null),
    steps: z.array(recipeStepSchema).max(MAX_RECIPE_STEPS).default([])
        .refine(steps => new Set(steps.map(step => step.id)).size === steps.length, { message: 'Duplicate step IDs' }),
});
export type RecipeStep = z.infer<typeof recipeStepSchema>;
export type RecipeContent = z.infer<typeof recipeContentSchema>;
