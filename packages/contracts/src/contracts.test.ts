import { describe, it, expect } from 'vitest';
import { createDishRequestSchema, updateDishRequestSchema, dishItemSchema, analyzeDishRequestSchema, aiExplainRequestSchema, localeSchema,dishAnalysisSchema,sensoryDimensions,pairCoverageSchema } from './index';
const item = { ingredientId: 'salmon', grams: 180, preparationId: 'raw' };
describe('external contract boundaries', () => {
    it('still reads versioned historical numerical analysis without rewriting it',()=>{
        const historical={overallScore:70,compatibilityScore:54,balanceScore:92,quantityScore:97,textureScore:27,confidence:55,profile:Object.fromEntries(sensoryDimensions.map(k=>[k,0])),totalWeight:1189,pairResults:[],issues:[],recommendations:[],composition:{totalItems:0,nutrients:[]}};
        expect(dishAnalysisSchema.parse(historical)).toEqual(historical);
    });
    it('does not accept contradictory coverage status or assessed-pair counts',()=>{
        expect(pairCoverageSchema.safeParse({status:'complete',assessedPairs:0,totalPairs:3,weightedPercent:0}).success).toBe(false);
        expect(pairCoverageSchema.safeParse({status:'partial',assessedPairs:4,totalPairs:3,weightedPercent:80}).success).toBe(false);
    });
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
