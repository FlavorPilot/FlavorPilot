import type { KnowledgeProvenance } from '@flavorpilot/contracts/domain';
import { explicitPairAdjustments, ingredients, preparationMethods } from './ingredients';
import { sourcedIdentities } from './sourced-identities';
import { nutrientHypotheses } from './nutrient-hypotheses';
import { catalogueIngredients } from './scoring-catalogue';
import { AI_HYPOTHESIS_VERSION, expandedHypothesisRationales } from './expanded-product-hypotheses';
/** Mass-weighted descriptive contrast and harmonic composition index; still unvalidated. */
export const MODEL_VERSION = '0.4.0-hypothesis';
export const CATALOGUE_VERSION = '2026-10-18-ai-2';
/** Closed alpha aims for reviewed coverage, not a generated catalogue of this size. */
export const ALPHA_REVIEW_TARGET = { min: 80, max: 120 } as const;
/** Commercial 1.0 cares more about reviewed coverage than about hitting the top of this range. */
export const RELEASE_REVIEW_TARGET = { min: 300, max: 500 } as const;
export const unreviewedHypothesis = (): KnowledgeProvenance => ({
    source: 'FlavorPilot 78c1a53 demo hypothesis',
    sourceLicense: null,
    reviewer: null,
    reviewStatus: 'unreviewed',
    confidence: 0,
    modelVersion: MODEL_VERSION,
    lastReviewedAt: null,
});
/** A reviewed row needs a person, a source, and a review time. Status alone is not evidence. */
export const isReviewedRecordComplete = (record: KnowledgeProvenance): boolean => record.reviewStatus !== 'reviewed' || Boolean(record.reviewer?.trim() && record.reviewer.trim().length >= 2 && record.source?.trim() && record.source.trim().length >= 3 && record.lastReviewedAt);
const hypothesis = () => unreviewedHypothesis();
export const ingredientKnowledge = new Map(ingredients.map(item => [item.id, hypothesis()]));
/** AI-authored additions have their own provenance, never the historic demo or USDA taste attribution. */
export const aiIngredientKnowledge = new Map(Object.entries(expandedHypothesisRationales).map(([id, rationale]) => [id, {
    ...unreviewedHypothesis(),
    source: `FlavorPilot AI-authored culinary hypothesis. ${rationale}`,
    modelVersion: AI_HYPOTHESIS_VERSION,
}]));
export const preparationKnowledge = new Map(preparationMethods.map(item => [item.id, hypothesis()]));
export const pairingKnowledge = new Map([...explicitPairAdjustments.keys()].map(key => [key, hypothesis()]));
export const knowledgeCoverage = () => ({
    catalogueVersion: CATALOGUE_VERSION,
    ingredients: ingredientKnowledge.size,
    reviewedIngredients: [...ingredientKnowledge.values()].filter(item => item.reviewStatus === 'reviewed').length,
    preparations: preparationKnowledge.size,
    reviewedPreparations: [...preparationKnowledge.values()].filter(item => item.reviewStatus === 'reviewed').length,
    pairings: pairingKnowledge.size,
    reviewedPairings: [...pairingKnowledge.values()].filter(item => item.reviewStatus === 'reviewed').length,
    sourcedIdentities: sourcedIdentities.length,
    reviewedSourcedIdentities: sourcedIdentities.filter(item => (item.reviewStatus as string) === 'reviewed').length,
    nutrientHypotheses: nutrientHypotheses.length,
    reviewedNutrientHypotheses: nutrientHypotheses.filter(item => (item.reviewStatus as string) === 'reviewed').length,
    scoringIngredients: catalogueIngredients.length,
    aiAuthoredIngredients: aiIngredientKnowledge.size,
    alphaTarget: ALPHA_REVIEW_TARGET,
    releaseTarget: RELEASE_REVIEW_TARGET,
});
