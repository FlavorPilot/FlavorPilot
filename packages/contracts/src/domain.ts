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
