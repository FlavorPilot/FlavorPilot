import { describe, it, expect } from 'vitest';
import { createDishRequestSchema, updateDishRequestSchema, dishItemSchema, analyzeDishRequestSchema, aiExplainRequestSchema, localeSchema } from './index';
const item = { ingredientId: 'salmon', grams: 180, preparationId: 'raw' };
describe('external contract boundaries', () => {
    it('retains original quantities and requires them to match the canonical edible grams',()=>{
        const counted={...item,ingredientId:'egg',grams:150,amount:{unit:'piece',quantity:3,gramsPerUnit:50}};
        expect(dishItemSchema.parse(counted)).toEqual(counted);
        expect(dishItemSchema.safeParse({...counted,grams:180}).success).toBe(false);
        for(const amount of [{unit:'cup',quantity:3,gramsPerUnit:50},{unit:'piece',quantity:0,gramsPerUnit:50},{unit:'piece',quantity:3,gramsPerUnit:Infinity}])expect(dishItemSchema.safeParse({...counted,amount}).success).toBe(false);
    });
    it('requires positive finite amounts', () => { for (const grams of [0, -1, Infinity, NaN, 5001])
        expect(dishItemSchema.safeParse({ ...item, grams }).success).toBe(false); });
    it('accepts en and uk, not ua or ru', () => { expect(localeSchema.parse('uk')).toBe('uk'); for (const x of ['ua', 'ru'])
        expect(localeSchema.safeParse(x).success).toBe(false); });
    it('defaults newly saved recipes to private', () => { expect(createDishRequestSchema.parse({ name: 'A dish', items: [item] }).visibility).toBe('private'); });
    it('allows an empty analysis but not an empty saved dish', () => { expect(analyzeDishRequestSchema.safeParse({ items: [] }).success).toBe(true); expect(createDishRequestSchema.safeParse({ name: 'A', items: [] }).success).toBe(false); });
    it('limits dishes to 24 rows', () => { expect(analyzeDishRequestSchema.safeParse({ items: Array(25).fill(item) }).success).toBe(false); });
    it('does not allow an empty patch', () => { expect(updateDishRequestSchema.safeParse({}).success).toBe(false); });
    it('preserves omitted preparation fields in patches and rejects revision-only updates',()=>{
        expect(updateDishRequestSchema.parse({name:'Renamed'})).toEqual({name:'Renamed'});
        expect(updateDishRequestSchema.safeParse({expectedVersionNumber:1}).success).toBe(false);
        expect(updateDishRequestSchema.parse({steps:[],servings:null})).toEqual({steps:[],servings:null});
    });
    it('does not accept legacy AI requests with only client scores', () => { expect(aiExplainRequestSchema.safeParse({ locale: 'en', dishName: 'X', analysis: { overallScore: 100 } }).success).toBe(false); });
    it('AI takes composition and strips unsupported score fields', () => { const parsed = aiExplainRequestSchema.parse({ locale: 'en', dishName: 'X', items: [item], analysis: { overallScore: 100 } }); expect('analysis' in parsed).toBe(false); expect(parsed.items).toEqual([item]); });
});
