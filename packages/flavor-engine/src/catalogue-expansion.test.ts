import { describe, it, expect } from 'vitest';
import { ingredients, ingredientById, preparationById, sourcedIdentities, nutrientHypotheses, analyzeDish, dishComposition, aiIngredientKnowledge, recommendedIngredientGrams } from './index';
import { sensoryDimensions, dishAnalysisSchema } from '@flavorpilot/contracts';

describe('expanded culinary hypotheses and published composition', () => {
    it('has 620 unique bilingual foods with complete bounded hypotheses and valid methods', () => {
        expect(ingredients).toHaveLength(620);
        expect(ingredientById.size).toBe(ingredients.length);
        expect(aiIngredientKnowledge.size).toBe(500);
        expect(new Set(ingredients.map(item => item.name.en)).size).toBe(ingredients.length);
        expect(new Set(ingredients.map(item => item.name.uk)).size).toBe(ingredients.length);
        for (const item of ingredients) {
            expect(item.name.en.trim().length).toBeGreaterThan(1);
            expect(item.name.uk).toMatch(/[А-Яа-яІіЇїЄєҐґ]/u);
            for (const axis of sensoryDimensions) {
                expect(Number.isFinite(item.profile[axis])).toBe(true);
                expect(item.profile[axis]).toBeGreaterThanOrEqual(0);
                expect(item.profile[axis]).toBeLessThanOrEqual(10);
            }
            expect(item.share.min).toBeGreaterThan(0);
            expect(item.share.min).toBeLessThanOrEqual(item.share.ideal);
            expect(item.share.ideal).toBeLessThanOrEqual(item.share.max);
            expect(item.share.max).toBeLessThanOrEqual(100);
            expect(item.preparations.every(id => preparationById.has(id))).toBe(true);
        }
    });
    it('distinguishes acidity, bitterness, pungency and richness rather than assigning one category score', () => {
        const profile = (id: string) => ingredientById.get(id)!.profile;
        expect(profile('mackerel').fat).toBeGreaterThan(profile('haddock').fat);
        expect(profile('blackcurrant').acidity).toBeGreaterThan(profile('watermelon').acidity);
        expect(profile('radicchio').bitterness).toBeGreaterThan(profile('butterhead').bitterness);
        expect(profile('fenugreek').bitterness).toBeGreaterThan(profile('anise').bitterness);
        expect(profile('cayenne').pungency).toBeGreaterThan(profile('saffron').pungency);
        expect(profile('shiitake').umami).toBeGreaterThan(profile('wood_ear').umami);
        expect(profile('egg_yolk').fat).toBeGreaterThan(profile('egg_white').fat);
        for (const row of aiIngredientKnowledge.values()) {
            expect(row.source).toContain('AI-authored');
            expect(row.reviewStatus).toBe('unreviewed');
            expect(row.reviewer).toBeNull();
            expect(row.confidence).toBe(0);
        }
    });
    it('every new food scores and has its own USDA identity and nutrient row', () => {
        const identities = new Map(sourcedIdentities.map(row => [row.id, row]));
        const nutrients = new Map(nutrientHypotheses.map(row => [row.identityId, row]));
        for (const id of aiIngredientKnowledge.keys()) {
            expect(identities.get(id)?.fdcId).toBeGreaterThan(0);
            expect(nutrients.has(id)).toBe(true);
            const result = analyzeDish([{ ingredientId: id, preparationId: 'raw', grams: 100 }], 'balanced', false);
            expect(result.totalWeight).toBe(100);
            expect(Number.isFinite(result.overallScore)).toBe(true);
            expect(result.composition.nutrients.every(row => row.contributions[0].fdcId === identities.get(id)?.fdcId)).toBe(true);
        }
    });
    it('preserves each row, source, unrounded contribution and nutrient-specific missing values', () => {
        const items = [
            { ingredientId: 'salmon', preparationId: 'seared', grams: 121.5 },
            { ingredientId: 'salt', preparationId: 'raw', grams: 2 },
            { ingredientId: 'rice_vinegar', preparationId: 'sauce', grams: 10 },
            { ingredientId: 'salmon', preparationId: 'raw', grams: 40.5 },
        ];
        const result = dishComposition(items);
        for (const nutrient of result.nutrients) {
            expect(nutrient.contributions.map(({ingredientId,preparationId,grams}) => ({ingredientId,preparationId,grams}))).toEqual(items);
            const covered = nutrient.contributions.filter(row => row.amount !== null);
            expect(nutrient.coveredItems).toBe(covered.length);
            const factor = nutrient.unit === 'g' ? 10 : 1;
            expect(nutrient.amount).toBe(covered.length ? Math.round(covered.reduce((sum,row) => sum + row.amount!, 0) * factor) / factor : null);
            expect(nutrient.contributions[2]).toMatchObject({ per100g: null, amount: null, fdcId: null });
        }
        expect(result.nutrients.find(row => row.nutrient === 'protein')?.coveredItems).toBe(2);
        expect(result.nutrients.find(row => row.nutrient === 'sodium')?.coveredItems).toBe(3);
    });
    it('counts a published zero as covered and leaves an entirely missing sum null', () => {
        const oil = dishComposition([{ ingredientId: 'sunflower_oil', preparationId: 'raw', grams: 17 }]);
        expect(oil.nutrients.find(row => row.nutrient === 'protein')).toMatchObject({ amount: 0, coveredItems: 1 });
        const missing = dishComposition([{ ingredientId: 'rice_vinegar', preparationId: 'sauce', grams: 10 }]);
        expect(missing.nutrients.every(row => row.amount === null && row.coveredItems === 0)).toBe(true);
    });
    it('the API response contract retains per-nutrient contributions', () => {
        const result = analyzeDish([{ ingredientId: 'shiitake', preparationId: 'roasted', grams: 150 }], 'balanced', false);
        expect(dishAnalysisSchema.parse(result)).toEqual(result);
    });
    it('the editor default for a concentrated spice uses the kernel amount, including fractions of a gram', () => {
        const saffron = ingredientById.get('saffron')!;
        const grams = recommendedIngredientGrams(saffron, 240);
        expect(grams).toBe(0.3);
        expect(grams / (240 + grams) * 100).toBeLessThanOrEqual(saffron.share.max);
    });
    it('recommendations can use foods outside the original demo and reproduce their preview delta', () => {
        const items = [{ ingredientId: 'salmon', preparationId: 'raw', grams: 180 }];
        const result = analyzeDish(items, 'fresh');
        expect(result.recommendations.some(row => aiIngredientKnowledge.has(row.ingredientId))).toBe(true);
        for (const suggestion of result.recommendations) {
            const preview = analyzeDish([...items, { ingredientId: suggestion.ingredientId, preparationId: 'raw', grams: suggestion.recommendedGrams }], 'fresh', false);
            expect(Math.abs(preview.balanceScore - result.balanceScore - suggestion.balanceDelta)).toBeLessThanOrEqual(1.01);
        }
    });
});
