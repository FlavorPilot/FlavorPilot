import { z } from "zod";

export const locales = ["en", "uk"] as const;
export const localeSchema = z.enum(locales);
export type Locale = z.infer<typeof localeSchema>;
export type LocalizedText = Record<Locale, string>;

export const sensoryDimensions = [
  "sweetness",
  "acidity",
  "saltiness",
  "bitterness",
  "umami",
  "fat",
  "pungency",
  "freshness",
  "aromaIntensity",
  "moisture"
] as const;

export const sensoryDimensionSchema = z.enum(sensoryDimensions);
export type SensoryDimension = z.infer<typeof sensoryDimensionSchema>;
export type SensoryProfile = Record<SensoryDimension, number>;

export const sensoryProfileSchema = z.object({
  sweetness: z.number().min(0).max(10),
  acidity: z.number().min(0).max(10),
  saltiness: z.number().min(0).max(10),
  bitterness: z.number().min(0).max(10),
  umami: z.number().min(0).max(10),
  fat: z.number().min(0).max(10),
  pungency: z.number().min(0).max(10),
  freshness: z.number().min(0).max(10),
  aromaIntensity: z.number().min(0).max(10),
  moisture: z.number().min(0).max(10)
});

export const dishGoals = [
  "balanced",
  "fresh",
  "rich",
  "spicy",
  "sweetSour",
  "smoky",
  "umami",
  "light",
  "creamy",
  "crunchy"
] as const;
export const dishGoalSchema = z.enum(dishGoals);
export type DishGoal = z.infer<typeof dishGoalSchema>;

export const ingredientRoles = [
  "base",
  "acid",
  "fat",
  "sweetener",
  "aromatic",
  "spice",
  "umami",
  "freshness",
  "texture",
  "sauce"
] as const;
export const ingredientRoleSchema = z.enum(ingredientRoles);
export type IngredientRole = z.infer<typeof ingredientRoleSchema>;

export const textureTags = [
  "tender",
  "creamy",
  "crisp",
  "crunchy",
  "juicy",
  "fibrous",
  "silky",
  "firm",
  "flaky",
  "sticky",
  "crumbly"
] as const;
export const textureTagSchema = z.enum(textureTags);
export type TextureTag = z.infer<typeof textureTagSchema>;

export interface PreparationMethod {
  id: string;
  name: LocalizedText;
  profileMultiplier: Partial<Record<SensoryDimension, number>>;
  intensityMultiplier: number;
  addAromas?: string[];
  addTextures?: TextureTag[];
}

export interface Ingredient {
  id: string;
  name: LocalizedText;
  category: LocalizedText;
  profile: SensoryProfile;
  intensity: number;
  textureIntensity: number;
  aromas: string[];
  textures: TextureTag[];
  roles: IngredientRole[];
  share: { min: number; ideal: number; max: number };
  preparations: string[];
}

export const dishItemSchema = z.object({
  ingredientId: z.string().trim().min(1).max(120),
  grams: z.number().finite().positive().max(5000),
  preparationId: z.string().trim().min(1).max(120)
});
export type DishItem = z.infer<typeof dishItemSchema>;

export const issueCodes = [
  "emptyDish",
  "singleIngredient",
  "fatNeedsAcid",
  "tooSweet",
  "tooIntense",
  "lowFreshness",
  "dominantIngredient",
  "flatTexture",
  "highSalt",
  "lowUmami"
] as const;
export const issueCodeSchema = z.enum(issueCodes);
export type IssueCode = z.infer<typeof issueCodeSchema>;

export const dishIssueSchema = z.object({
  code: issueCodeSchema,
  severity: z.enum(["info", "warning", "critical"]),
  ingredientId: z.string().optional(),
  value: z.number().optional()
});
export type DishIssue = z.infer<typeof dishIssueSchema>;

export const pairResultSchema = z.object({
  ingredientAId: z.string(),
  ingredientBId: z.string(),
  score: z.number(),
  aromaOverlap: z.number(),
  complementScore: z.number(),
  explicitAdjustment: z.number()
});
export type PairResult = z.infer<typeof pairResultSchema>;

export const recommendationReasons = [
  "strongPairing",
  "addsAcidity",
  "balancesFat",
  "addsFreshness",
  "addsUmami",
  "addsSweetness",
  "addsPungency",
  "addsCrunch",
  "supportsGoal",
  "improvesBalance"
] as const;
export const recommendationReasonSchema = z.enum(recommendationReasons);
export type RecommendationReason = z.infer<typeof recommendationReasonSchema>;

export const ingredientRecommendationSchema = z.object({
  ingredientId: z.string(),
  compatibility: z.number(),
  utility: z.number(),
  recommendedGrams: z.number(),
  balanceDelta: z.number(),
  reasons: z.array(recommendationReasonSchema)
});
export type IngredientRecommendation = z.infer<typeof ingredientRecommendationSchema>;

export const dishAnalysisSchema = z.object({
  overallScore: z.number(),
  compatibilityScore: z.number(),
  balanceScore: z.number(),
  quantityScore: z.number(),
  textureScore: z.number(),
  confidence: z.number(),
  profile: sensoryProfileSchema,
  totalWeight: z.number(),
  dominantIngredientId: z.string().optional(),
  pairResults: z.array(pairResultSchema),
  issues: z.array(dishIssueSchema),
  recommendations: z.array(ingredientRecommendationSchema)
});
export type DishAnalysis = z.infer<typeof dishAnalysisSchema>;

export const analyzeDishRequestSchema = z.object({
  goal: dishGoalSchema.default("balanced"),
  items: z.array(dishItemSchema).max(24),
  includeRecommendations: z.boolean().default(true)
});
export type AnalyzeDishRequest = z.input<typeof analyzeDishRequestSchema>;
export type NormalizedAnalyzeDishRequest = z.output<typeof analyzeDishRequestSchema>;

export const dishVisibilities = ["public", "unlisted", "private"] as const;
export const dishVisibilitySchema = z.enum(dishVisibilities);
export type DishVisibility = z.infer<typeof dishVisibilitySchema>;

export const savedDishSchema = z.object({
  id: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(160),
  items: z.array(dishItemSchema).min(1).max(24),
  goal: dishGoalSchema,
  visibility: dishVisibilitySchema,
  createdAt: z.string().datetime(),
  parentDishId: z.string().trim().min(1).max(160).optional()
});
export type SavedDish = z.infer<typeof savedDishSchema>;

export const aiExplainRequestSchema = z.object({
  locale: localeSchema,
  dishName: z.string().trim().max(160),
  analysis: dishAnalysisSchema
});
export type AiExplainRequest = z.infer<typeof aiExplainRequestSchema>;

export const aiExplainActionSchema = z.object({
  title: z.string(),
  explanation: z.string()
});
export const aiExplainResponseSchema = z.object({
  summary: z.string(),
  main_problem: z.string(),
  actions: z.array(aiExplainActionSchema)
});
export type AiExplainResponse = z.infer<typeof aiExplainResponseSchema>;
