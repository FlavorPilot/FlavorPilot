import { describe, it, expect } from 'vitest';
import { analyzeDish, calculatePair } from './engine';
import { defaultDish, ingredientById } from './ingredients';
import { isReviewedRecordComplete, knowledgeCoverage } from './knowledge';
import { sourcedIdentities } from './sourced-identities';
const p = (id: string) => { const ingredient = ingredientById.get(id)!; return { ingredient, profile: ingredient.profile, intensity: ingredient.intensity, aromas: ingredient.aromas, textures: ingredient.textures }; };
describe('inherited deterministic model', () => {
    it('preserves the recorded default composition output', () => { const a = analyzeDish(defaultDish, 'fresh'); expect([a.overallScore, a.balanceScore, a.totalWeight]).toEqual([74, 61, 313]); });
    it('pair score is symmetric', () => { expect(calculatePair(p('duck'), p('cherry')).score).toBe(calculatePair(p('cherry'), p('duck')).score); });
    it('does not mutate the source composition', () => { const before = JSON.stringify(defaultDish); analyzeDish(defaultDish, 'fresh'); expect(JSON.stringify(defaultDish)).toBe(before); });
    it('supports an empty editor without NaN', () => { expect(analyzeDish([]).overallScore).toBe(0); expect(analyzeDish([]).issues[0].code).toBe('emptyDish'); });
    it('CUL-001: warns that rosemary is above its working maximum without treating impact dominance as the same fact', () => {
        const items = [{ ingredientId: 'duck', grams: 220, preparationId: 'seared' }, { ingredientId: 'cherry', grams: 70, preparationId: 'sauce' }];
        const normal = analyzeDish([...items, { ingredientId: 'rosemary', grams: 1.2, preparationId: 'roasted' }], 'rich');
        const excess = analyzeDish([...items, { ingredientId: 'rosemary', grams: 35, preparationId: 'roasted' }], 'rich');
        expect(excess.quantityScore).toBeLessThan(normal.quantityScore);
        expect(excess.issues.find(issue => issue.severity === 'warning')).toMatchObject({ code: 'outsideRecommendedRange', ingredientId: 'rosemary' });
        expect(excess.dominantIngredientId).not.toBe('rosemary');
        expect(normal.issues.some(issue => issue.code === 'outsideRecommendedRange' && issue.ingredientId === 'rosemary')).toBe(false);
    });
    it('keeps the bundled catalogue unreviewed', () => {
        const coverage = knowledgeCoverage();
        expect(coverage).toMatchObject({ ingredients: 38, preparations: 12, pairings: 64, reviewedIngredients: 0, reviewedPreparations: 0, reviewedPairings: 0, sourcedIdentities: 119, reviewedSourcedIdentities: 0, nutrientHypotheses: 119, reviewedNutrientHypotheses: 0, scoringIngredients: 120 });
        expect(sourcedIdentities.every(row => row.reviewStatus === 'unreviewed' && row.sensoryProfile === null && row.confidence === 0 && row.sourceLicense === 'CC0-1.0')).toBe(true);
        expect(isReviewedRecordComplete({ source: null, sourceLicense: null, reviewer: ' ', reviewStatus: 'reviewed', confidence: 1, modelVersion: '0.3.0-hypothesis', lastReviewedAt: '2026-09-23T00:00:00.000Z' })).toBe(false);
    });
});
