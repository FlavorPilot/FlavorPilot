import { z } from 'zod';
import { locales, sensoryDimensions, dishGoals, ingredientRoles, textureTags, issueCodes, recommendationReasons, dishVisibilities } from './domain';
export * from './domain';
export const localeSchema = z.enum(locales);
export const sensoryDimensionSchema = z.enum(sensoryDimensions);
export const sensoryProfileSchema = z.object({
    sweetness: z.number().min(0).max(10), acidity: z.number().min(0).max(10), saltiness: z.number().min(0).max(10), bitterness: z.number().min(0).max(10),
    umami: z.number().min(0).max(10), fat: z.number().min(0).max(10), pungency: z.number().min(0).max(10), freshness: z.number().min(0).max(10), aromaIntensity: z.number().min(0).max(10), moisture: z.number().min(0).max(10)
});
export const dishGoalSchema = z.enum(dishGoals);
export const ingredientRoleSchema = z.enum(ingredientRoles);
export const textureTagSchema = z.enum(textureTags);
export const dishItemSchema = z.object({ ingredientId: z.string().trim().min(1).max(120), grams: z.number().finite().positive().max(5000), preparationId: z.string().trim().min(1).max(120) });
export const issueCodeSchema = z.enum(issueCodes);
export const dishIssueSchema = z.object({ code: issueCodeSchema, severity: z.enum(['info', 'warning', 'critical']), ingredientId: z.string().optional(), value: z.number().optional() });
export const pairResultSchema = z.object({ ingredientAId: z.string(), ingredientBId: z.string(), score: z.number(), aromaOverlap: z.number(), complementScore: z.number(), explicitAdjustment: z.number() });
export const recommendationReasonSchema = z.enum(recommendationReasons);
export const ingredientRecommendationSchema = z.object({ ingredientId: z.string(), compatibility: z.number(), utility: z.number(), recommendedGrams: z.number(), balanceDelta: z.number(), reasons: z.array(recommendationReasonSchema) });
export const dishAnalysisSchema = z.object({ overallScore: z.number(), compatibilityScore: z.number(), balanceScore: z.number(), quantityScore: z.number(), textureScore: z.number(), confidence: z.number(), profile: sensoryProfileSchema, totalWeight: z.number(), dominantIngredientId: z.string().optional(), pairResults: z.array(pairResultSchema), issues: z.array(dishIssueSchema), recommendations: z.array(ingredientRecommendationSchema) });
export const analyzeDishRequestSchema = z.object({ goal: dishGoalSchema.default('balanced'), items: z.array(dishItemSchema).max(24), includeRecommendations: z.boolean().default(true) });
export type AnalyzeDishRequest = z.input<typeof analyzeDishRequestSchema>;
export type NormalizedAnalyzeDishRequest = z.output<typeof analyzeDishRequestSchema>;
export const dishVisibilitySchema = z.enum(dishVisibilities);
export const savedDishSchema = z.object({ id: z.string().trim().min(1).max(160), name: z.string().trim().min(1).max(160), items: z.array(dishItemSchema).min(1).max(24), goal: dishGoalSchema, visibility: dishVisibilitySchema, createdAt: z.string().datetime(), parentDishId: z.string().trim().min(1).max(160).optional() });
// Rebuild r2: the API recalculates analysis; browser-supplied scores are never trusted.
export const aiExplainRequestSchema = analyzeDishRequestSchema.extend({ locale: localeSchema, dishName: z.string().trim().max(160) });
export type AiExplainRequest = z.infer<typeof aiExplainRequestSchema>;
export const aiExplainActionSchema = z.object({ title: z.string(), explanation: z.string() });
export const aiExplainResponseSchema = z.object({ summary: z.string(), main_problem: z.string(), actions: z.array(aiExplainActionSchema) });
export type AiExplainResponse = z.infer<typeof aiExplainResponseSchema>;
