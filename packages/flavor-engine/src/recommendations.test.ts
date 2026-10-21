import { describe, expect, it } from 'vitest';
import { dishAnalysisSchema, dishGoals, type DishItem } from '@flavorpilot/contracts';
import { analyzeDish } from './engine';
import { defaultDish, preparationById } from './ingredients';
import { catalogueById } from './scoring-catalogue';

const salad: DishItem[] = [{ ingredientId: 'tomato', grams: 150, preparationId: 'raw' }, { ingredientId: 'cucumber', grams: 80, preparationId: 'raw' }];
describe('composition-specific recommendations', () => {
    it('reproduces every displayed delta and profile change with the exact trial portion and preparation', () => {
        for (const goal of dishGoals) {
            const before = analyzeDish(defaultDish, goal);
            expect(before.recommendations.length).toBeGreaterThan(0);
            expect(dishAnalysisSchema.parse(before)).toEqual(before);
            for (const recommendation of before.recommendations) {
                const ingredient = catalogueById.get(recommendation.ingredientId)!;
                const after = analyzeDish([...defaultDish, { ingredientId: ingredient.id, grams: recommendation.recommendedGrams, preparationId: recommendation.preparationId }], goal, false);
                expect(ingredient.preparations).toContain(recommendation.preparationId);
                expect(after.overallScore - before.overallScore).toBe(recommendation.overallDelta);
                expect(recommendation.overallDelta).toBeGreaterThan(0);
                expect(after.balanceScore - before.balanceScore).toBe(recommendation.balanceDelta);
                for (const change of recommendation.profileChanges) {
                    expect(change.before).toBe(before.profile[change.dimension]);
                    expect(change.after).toBe(after.profile[change.dimension]);
                    expect(change.after).not.toBe(change.before);
                }
                const share = recommendation.recommendedGrams / (before.totalWeight + recommendation.recommendedGrams) * 100;
                expect(share).toBeGreaterThanOrEqual(ingredient.share.min);
                expect(share).toBeLessThanOrEqual(ingredient.share.ideal);
                expect(share).toBeLessThanOrEqual(ingredient.share.max);
                const increases = { addsAcidity: 'acidity', addsFreshness: 'freshness', addsUmami: 'umami', addsSweetness: 'sweetness', addsPungency: 'pungency' } as const;
                for (const [reason, dimension] of Object.entries(increases)) {
                    if (recommendation.reasons.includes(reason as keyof typeof increases))
                        expect(after.profile[dimension]).toBeGreaterThan(before.profile[dimension]);
                }
                if (recommendation.reasons.includes('strongPairing')) expect(recommendation.compatibility).toBeGreaterThanOrEqual(78);
                if (recommendation.reasons.includes('addsCrunch')) expect(after.textureScore).toBeGreaterThan(before.textureScore);
                if (recommendation.reasons.includes('balancesFat')) expect(after.balanceScore).toBeGreaterThanOrEqual(before.balanceScore);
            }
        }
    });
    it('changes selection with composition, proportions, preparation and direction', () => {
        const original = analyzeDish(defaultDish, 'fresh').recommendations;
        expect(analyzeDish(salad, 'fresh').recommendations).not.toEqual(original);
        expect(analyzeDish(defaultDish.map((item, index) => index ? item : { ...item, grams: item.grams * 2 }), 'fresh').recommendations).not.toEqual(original);
        expect(analyzeDish(defaultDish.map((item, index) => index ? item : { ...item, preparationId: 'smoked' }), 'fresh').recommendations).not.toEqual(original);
        expect(analyzeDish(defaultDish, 'rich').recommendations).not.toEqual(original);
        expect(analyzeDish(defaultDish, 'fresh').recommendations).toEqual(original);
    });
    it('scales trial portions with the dish instead of using a fixed 180 g ceiling', () => {
        const original = analyzeDish(defaultDish, 'fresh').recommendations;
        const scaled = analyzeDish(defaultDish.map(item => ({ ...item, grams: item.grams * 4 })), 'fresh').recommendations;
        const large = analyzeDish(defaultDish.map(item => ({ ...item, grams: item.grams * 20 })), 'fresh').recommendations;
        expect(large.some(row => row.recommendedGrams > 180)).toBe(true);
        for (const recommendation of original) {
            const match = scaled.find(row => row.ingredientId === recommendation.ingredientId);
            expect(match).toBeDefined();
            expect(Math.abs(match!.recommendedGrams - recommendation.recommendedGrams * 4)).toBeLessThanOrEqual(.4);
        }
    });
    it('does not repeat the same role and prepared texture to fill the grid', () => {
        for (const items of [defaultDish, salad]) {
            const groups = analyzeDish(items, 'fresh').recommendations.map(row => {
                const ingredient = catalogueById.get(row.ingredientId)!;
                const textures = [...new Set([...ingredient.textures, ...(preparationById.get(row.preparationId)?.addTextures ?? [])])].sort();
                return JSON.stringify([[...ingredient.roles].sort(), textures]);
            });
            expect(new Set(groups).size).toBe(groups.length);
        }
    });
    it('does not offer additions for an empty or full composition', () => {
        expect(analyzeDish([]).recommendations).toEqual([]);
        expect(analyzeDish(Array.from({ length: 24 }, (_, index) => ({ ...defaultDish[index % defaultDish.length] }))).recommendations).toEqual([]);
    });
});
