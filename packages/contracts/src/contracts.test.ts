import { describe, it, expect } from 'vitest';
import { createDishRequestSchema, updateDishRequestSchema, dishItemSchema, analyzeDishRequestSchema, aiExplainRequestSchema, localeSchema } from './index';
const item = { ingredientId: 'salmon', grams: 180, preparationId: 'raw' };
describe('external contract boundaries', () => {
    it('requires positive finite amounts', () => { for (const grams of [0, -1, Infinity, NaN, 5001])
        expect(dishItemSchema.safeParse({ ...item, grams }).success).toBe(false); });
    it('accepts en and uk, not ua or ru', () => { expect(localeSchema.parse('uk')).toBe('uk'); for (const x of ['ua', 'ru'])
        expect(localeSchema.safeParse(x).success).toBe(false); });
    it('defaults newly saved recipes to private', () => { expect(createDishRequestSchema.parse({ name: 'A dish', items: [item] }).visibility).toBe('private'); });
    it('allows an empty analysis but not an empty saved dish', () => { expect(analyzeDishRequestSchema.safeParse({ items: [] }).success).toBe(true); expect(createDishRequestSchema.safeParse({ name: 'A', items: [] }).success).toBe(false); });
    it('limits dishes to 24 rows', () => { expect(analyzeDishRequestSchema.safeParse({ items: Array(25).fill(item) }).success).toBe(false); });
    it('does not allow an empty patch', () => { expect(updateDishRequestSchema.safeParse({}).success).toBe(false); });
    it('does not accept legacy AI requests with only client scores', () => { expect(aiExplainRequestSchema.safeParse({ locale: 'en', dishName: 'X', analysis: { overallScore: 100 } }).success).toBe(false); });
    it('AI takes composition and strips unsupported score fields', () => { const parsed = aiExplainRequestSchema.parse({ locale: 'en', dishName: 'X', items: [item], analysis: { overallScore: 100 } }); expect('analysis' in parsed).toBe(false); expect(parsed.items).toEqual([item]); });
});
