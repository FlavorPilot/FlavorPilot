import { describe, it, expect } from 'vitest';
import { analyzeDish, calculatePair } from './engine';
import { defaultDish, ingredientById } from './ingredients';
const p = (id: string) => { const ingredient = ingredientById.get(id)!; return { ingredient, profile: ingredient.profile, intensity: ingredient.intensity, aromas: ingredient.aromas, textures: ingredient.textures }; };
describe('inherited deterministic model', () => {
    it('preserves the recorded default composition output', () => { const a = analyzeDish(defaultDish, 'fresh'); expect([a.overallScore, a.balanceScore, a.totalWeight]).toEqual([74, 61, 313]); });
    it('pair score is symmetric', () => { expect(calculatePair(p('duck'), p('cherry')).score).toBe(calculatePair(p('cherry'), p('duck')).score); });
    it('does not mutate the source composition', () => { const before = JSON.stringify(defaultDish); analyzeDish(defaultDish, 'fresh'); expect(JSON.stringify(defaultDish)).toBe(before); });
    it('supports an empty editor without NaN', () => { expect(analyzeDish([]).overallScore).toBe(0); expect(analyzeDish([]).issues[0].code).toBe('emptyDish'); });
    it.todo('CUL-001: add an explicit warning for a high-dose aromatic even when the base has the highest total impact');
});
