/** Pure domain values/types. No framework, validation, network or storage side effects. */
export const locales = ['en', 'uk'] as const;
export type Locale = typeof locales[number];
export type LocalizedText = Record<Locale, string>;
export const sensoryDimensions = ['sweetness', 'acidity', 'saltiness', 'bitterness', 'umami', 'fat', 'pungency', 'freshness', 'aromaIntensity', 'moisture'] as const;
export type SensoryDimension = typeof sensoryDimensions[number];
export type SensoryProfile = Record<SensoryDimension, number>;
export const dishGoals = ['balanced', 'fresh', 'rich', 'spicy', 'sweetSour', 'smoky', 'umami', 'light', 'creamy', 'crunchy'] as const;
export type DishGoal = typeof dishGoals[number];
export const ingredientRoles = ['base', 'acid', 'fat', 'sweetener', 'aromatic', 'spice', 'umami', 'freshness', 'texture', 'sauce'] as const;
export type IngredientRole = typeof ingredientRoles[number];
export const textureTags = ['tender', 'creamy', 'crisp', 'crunchy', 'juicy', 'fibrous', 'silky', 'firm', 'flaky', 'sticky', 'crumbly'] as const;
export type TextureTag = typeof textureTags[number];
export interface PreparationMethod {
    id: string;
    name: LocalizedText;
    profileMultiplier: Partial<Record<SensoryDimension, number>>;
    intensityMultiplier: number;
    addAromas?: string[];
    addTextures?: TextureTag[];
}
export const reviewStatuses = ['unreviewed', 'in_review', 'reviewed', 'rejected'] as const;
export type ReviewStatus = typeof reviewStatuses[number];
/** Provenance of a catalogue row. Distinct from the analysis heuristic named confidence. */
export interface KnowledgeProvenance {
    source: string | null;
    sourceLicense: string | null;
    reviewer: string | null;
    reviewStatus: ReviewStatus;
    confidence: number;
    modelVersion: string;
    lastReviewedAt: string | null;
}
/** Identity cited from a public dataset. Sensory fields stay empty until a person reviews them. */
export interface SourcedIngredientIdentity {
    id: string;
    catalogIngredientId: string | null;
    nameEn: string;
    nameUk: string;
    nameUkOrigin: 'project-translation';
    fdcId: number;
    fdcDescription: string;
    fdcDataType: 'foundation_food' | 'sr_legacy_food';
    fdcFoodCategory: string;
    fdcPublicationDate: string;
    dataset: string;
    source: string;
    sourceUrl: string;
    sourceLicense: 'CC0-1.0';
    licenseUrl: string;
    sensoryProfile: null;
    preparationEffects: null;
    recommendedRange: null;
    pairingEvidence: null;
    reviewer: null;
    reviewStatus: 'unreviewed';
    confidence: 0;
    modelVersion: string;
    lastReviewedAt: null;
}
/** Nutrient-density hypothesis. Missing axes stay null. This is not a taste measurement. */
export interface NutrientHypothesis {
    identityId: string;
    formula: 'nutrient-proxy-1';
    sodiumMg: number | null;
    sodiumNutrientId: 1093 | null;
    fatG: number | null;
    fatNutrientId: 1004 | 1085 | null;
    sugarsG: number | null;
    sugarsNutrientId: 2000 | 1063 | null;
    waterG: number | null;
    waterNutrientId: 1051 | null;
    proteinG: number | null;
    proteinNutrientId: 1003 | null;
    carbohydrateG: number | null;
    carbohydrateNutrientId: 1005 | 1050 | null;
    energyKcal: number | null;
    energyNutrientId: 1008 | 2047 | 2048 | null;
    saltiness: number | null;
    fat: number | null;
    sweetness: number | null;
    moisture: number | null;
    reviewer: null;
    reviewStatus: 'unreviewed';
    confidence: 0;
    sourceLicense: 'CC0-1.0';
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
    share: {
        min: number;
        ideal: number;
        max: number;
    };
    preparations: string[];
    /** When set, only these axes affect the dish profile. Omitted means every axis counts. */
    scoredDimensions?: SensoryDimension[];
}
export interface DishItem {
    ingredientId: string;
    grams: number;
    preparationId: string;
}
export const issueCodes = ['emptyDish', 'singleIngredient', 'fatNeedsAcid', 'tooSweet', 'tooIntense', 'lowFreshness', 'dominantIngredient', 'outsideRecommendedRange', 'flatTexture', 'highSalt', 'lowUmami'] as const;
export type IssueCode = typeof issueCodes[number];
export interface DishIssue {
    code: IssueCode;
    severity: 'info' | 'warning' | 'critical';
    ingredientId?: string;
    value?: number;
}
export interface PairResult {
    ingredientAId: string;
    ingredientBId: string;
    score: number;
    aromaOverlap: number;
    complementScore: number;
    explicitAdjustment: number;
}
export const recommendationReasons = ['strongPairing', 'addsAcidity', 'balancesFat', 'addsFreshness', 'addsUmami', 'addsSweetness', 'addsPungency', 'addsCrunch', 'supportsGoal', 'improvesBalance'] as const;
export type RecommendationReason = typeof recommendationReasons[number];
export interface IngredientRecommendation {
    ingredientId: string;
    compatibility: number;
    utility: number;
    recommendedGrams: number;
    balanceDelta: number;
    reasons: RecommendationReason[];
}
export const compositionNutrients = ['protein', 'fat', 'carbohydrate', 'sugars', 'sodium', 'energy'] as const;
export type CompositionNutrientId = typeof compositionNutrients[number];
/** Published USDA amounts scaled by dish grams. Missing amounts stay out of the sum. */
export interface CompositionAmount {
    nutrient: CompositionNutrientId;
    unit: 'g' | 'mg' | 'kcal';
    amount: number | null;
    coveredItems: number;
    totalItems: number;
}
export interface DishComposition {
    totalItems: number;
    nutrients: CompositionAmount[];
}
export interface DishAnalysis {
    overallScore: number;
    compatibilityScore: number;
    balanceScore: number;
    quantityScore: number;
    textureScore: number;
    confidence: number;
    profile: SensoryProfile;
    totalWeight: number;
    dominantIngredientId?: string;
    pairResults: PairResult[];
    issues: DishIssue[];
    recommendations: IngredientRecommendation[];
    composition: DishComposition;
}
export const dishVisibilities = ['public', 'unlisted', 'private'] as const;
export type DishVisibility = typeof dishVisibilities[number];
export interface SavedDish {
    id: string;
    name: string;
    items: DishItem[];
    goal: DishGoal;
    visibility: DishVisibility;
    createdAt: string;
    parentDishId?: string;
}
