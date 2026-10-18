import { z } from 'zod';
import { dishGoalSchema, dishItemSchema, localeSchema } from './flavor';
import { recipeContentSchema } from './recipe';
export const aiRecipeSchema = recipeContentSchema.extend({name:z.string().trim().max(160),goal:dishGoalSchema,items:z.array(dishItemSchema).min(1).max(24)});
export const aiReviewRequestSchema=z.object({requestId:z.string().uuid(),locale:localeSchema,scope:z.enum(['step','full']),includeOutcome:z.boolean().optional(),activeStepId:z.string().uuid().optional(),dishId:z.string().uuid().optional(),recipe:aiRecipeSchema}).strict()
 .refine(v=>v.scope==='full'||!v.includeOutcome,{message:'Outcome is available for full review only'})
 .refine(v=>v.scope!=='step'||v.recipe.steps.some(s=>s.id===v.activeStepId&&s.text.trim()),{message:'A valid active step is required'});
export const aiCommentSchema=z.object({id:z.string().uuid(),kind:z.enum(['clarity','consistency','ingredientUsage','technique']),stepId:z.string().uuid().nullable(),message:z.string().min(1).max(1200),suggestedText:z.string().min(1).max(4000).nullable()}).strict();
const shortText=z.string().trim().min(1).max(1200);
export const aiDishOutcomeSchema=z.object({verdict:z.enum(['promising','mixed','needsWork','insufficientContext']),summary:shortText,taste:shortText,texture:shortText,strengths:z.array(shortText).max(4),risks:z.array(shortText).max(4),cookingAdvice:z.array(z.object({title:z.string().trim().min(1).max(160),instruction:shortText,reason:shortText}).strict()).min(1).max(4),assumptions:z.array(shortText).max(4)}).strict();
export const aiReviewResultSchema=z.object({comments:z.array(aiCommentSchema).max(6),outcome:aiDishOutcomeSchema.optional()}).strict();
export const aiCapabilitiesSchema=z.object({enabled:z.boolean(),access:z.enum(['none','paid','pilot','free_test','guest_test']),allowancePeriod:z.enum(['calendar','test']).default('calendar'),remaining:z.number().int().nonnegative(),dailyRemaining:z.number().int().nonnegative(),resetAt:z.string().datetime(),dailyResetAt:z.string().datetime(),costs:z.object({explain:z.literal(2),step:z.literal(1),full:z.literal(4),generate:z.literal(4).default(4)}),reason:z.enum(['AI_DISABLED','AI_PLAN_REQUIRED','AI_QUOTA_EXCEEDED']).nullable()});
export const aiGuestSessionSchema=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),quota:aiCapabilitiesSchema}).strict();
export const aiReviewResponseSchema=aiReviewResultSchema.extend({requestId:z.string().uuid(),contentHash:z.string(),quota:aiCapabilitiesSchema});
export const aiGenerateRequestSchema=z.object({requestId:z.string().uuid(),locale:localeSchema,dishId:z.string().uuid().optional(),recipe:aiRecipeSchema,brief:z.string().trim().max(1000).default('')}).strict();
export const aiGeneratedRecipeSchema=z.object({name:z.string().trim().min(1).max(160),description:z.string().trim().min(1).max(1200),servings:z.number().int().min(1).max(1000).nullable(),steps:z.array(z.object({id:z.string().uuid(),text:z.string().trim().min(1).max(2000),ingredientIds:z.array(z.string().min(1).max(100)).max(24)}).strict()).min(1).max(16)}).strict().refine(v=>new Set(v.steps.map(s=>s.id)).size===v.steps.length,{message:'Duplicate generated step IDs'});
export const aiGenerateResultSchema=z.object({recipe:aiGeneratedRecipeSchema,assumptions:z.array(shortText).max(4)}).strict();
export const aiGenerateResponseSchema=aiGenerateResultSchema.extend({requestId:z.string().uuid(),contentHash:z.string(),quota:aiCapabilitiesSchema});
export type AiRecipe=z.infer<typeof aiRecipeSchema>;
export type AiReviewRequest=z.infer<typeof aiReviewRequestSchema>;
export type AiReviewResponse=z.infer<typeof aiReviewResponseSchema>;
export type AiCapabilities=z.infer<typeof aiCapabilitiesSchema>;
export type AiComment=z.infer<typeof aiCommentSchema>;
export type AiDishOutcome=z.infer<typeof aiDishOutcomeSchema>;
export type AiGeneratedRecipe=z.infer<typeof aiGeneratedRecipeSchema>;
export type AiGenerateRequest=z.infer<typeof aiGenerateRequestSchema>;
export type AiGenerateResponse=z.infer<typeof aiGenerateResponseSchema>;
