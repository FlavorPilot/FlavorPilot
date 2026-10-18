import { z } from 'zod';
import { dishGoalSchema, dishItemSchema, localeSchema } from './flavor';
import { recipeContentSchema } from './recipe';
export const aiRecipeSchema = recipeContentSchema.extend({name:z.string().trim().max(160),goal:dishGoalSchema,items:z.array(dishItemSchema).min(1).max(24)});
export const aiReviewRequestSchema=z.object({requestId:z.string().uuid(),locale:localeSchema,scope:z.enum(['step','full']),activeStepId:z.string().uuid().optional(),dishId:z.string().uuid().optional(),recipe:aiRecipeSchema}).strict()
 .refine(v=>v.recipe.steps.some(s=>s.text.trim()),{message:'A nonempty step is required'})
 .refine(v=>v.scope!=='step'||v.recipe.steps.some(s=>s.id===v.activeStepId&&s.text.trim()),{message:'A valid active step is required'});
export const aiCommentSchema=z.object({id:z.string().uuid(),kind:z.enum(['clarity','consistency','ingredientUsage','technique']),stepId:z.string().uuid().nullable(),message:z.string().min(1).max(1200),suggestedText:z.string().min(1).max(4000).nullable()}).strict();
export const aiReviewResultSchema=z.object({comments:z.array(aiCommentSchema).max(6)}).strict();
export const aiCapabilitiesSchema=z.object({enabled:z.boolean(),access:z.enum(['none','paid','pilot']),remaining:z.number().int().nonnegative(),dailyRemaining:z.number().int().nonnegative(),resetAt:z.string().datetime(),dailyResetAt:z.string().datetime(),costs:z.object({explain:z.literal(2),step:z.literal(1),full:z.literal(4)}),reason:z.enum(['AI_DISABLED','AI_PLAN_REQUIRED','AI_QUOTA_EXCEEDED']).nullable()});
export const aiReviewResponseSchema=aiReviewResultSchema.extend({requestId:z.string().uuid(),contentHash:z.string(),quota:aiCapabilitiesSchema});
export type AiRecipe=z.infer<typeof aiRecipeSchema>;
export type AiReviewRequest=z.infer<typeof aiReviewRequestSchema>;
export type AiReviewResponse=z.infer<typeof aiReviewResponseSchema>;
export type AiCapabilities=z.infer<typeof aiCapabilitiesSchema>;
export type AiComment=z.infer<typeof aiCommentSchema>;
