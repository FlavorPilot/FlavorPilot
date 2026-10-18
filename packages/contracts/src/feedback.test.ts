import { describe, expect, it } from 'vitest';
import { commentListQuerySchema, createCommentRequestSchema, modelFeedbackRequestSchema } from './feedback';
const recipe = {name:'A draft',goal:'balanced',description:'Method notes',servings:2,steps:[{id:'aa731c70-950a-4778-937a-b7185e1b4fae',text:'Cook the fish.'}],items:[{ingredientId:'salmon',grams:150,preparationId:'seared'},{ingredientId:'lime',grams:12,preparationId:'raw'}]};
const feedback = {recipe,modelVersion:'model-1',catalogueVersion:'catalogue-1',cooked:true,agreement:'partial',concerns:['balance'],note:' Too sour. '};
describe('feedback boundaries',()=>{
    it('retains the authored recipe and cooked/expectation distinction',()=>{
        expect(modelFeedbackRequestSchema.parse(feedback)).toMatchObject({recipe,note:'Too sour.',cooked:true});
        expect(modelFeedbackRequestSchema.parse({...feedback,cooked:false}).cooked).toBe(false);
    });
    it('rejects caller scores, ownership and unknown fields at every input level',()=>{
        for(const extra of [{analysis:{overallScore:100}},{ownerId:'someone'},{visibility:'public'}])expect(modelFeedbackRequestSchema.safeParse({...feedback,...extra}).success).toBe(false);
        expect(modelFeedbackRequestSchema.safeParse({...feedback,recipe:{...recipe,ownerId:'someone'}}).success).toBe(false);
        expect(modelFeedbackRequestSchema.safeParse({...feedback,recipe:{...recipe,items:recipe.items.map(item=>({...item,score:100}))}}).success).toBe(false);
    });
    it('requires an explicit cooked flag, agreement and actual analysable composition',()=>{
        for(const cooked of [undefined,'true',1])expect(modelFeedbackRequestSchema.safeParse({...feedback,cooked}).success).toBe(false);
        expect(modelFeedbackRequestSchema.safeParse({...feedback,agreement:'five-stars'}).success).toBe(false);
        expect(modelFeedbackRequestSchema.safeParse({...feedback,recipe:{...recipe,items:recipe.items.slice(0,1)}}).success).toBe(false);
        expect(modelFeedbackRequestSchema.safeParse({...feedback,dishVersionNumber:2}).success).toBe(false);
    });
    it('rejects duplicate/unknown concerns, contradictory answers and excessive text',()=>{
        for(const concerns of [['texture','texture'],['nutrition']])expect(modelFeedbackRequestSchema.safeParse({...feedback,concerns}).success).toBe(false);
        expect(modelFeedbackRequestSchema.safeParse({...feedback,agreement:'matches'}).success).toBe(false);
        expect(modelFeedbackRequestSchema.safeParse({...feedback,note:'x'.repeat(2001)}).success).toBe(false);
    });
});
describe('public discussion boundaries',()=>{
    it('trims comments but rejects empty text, invalid links and spoofed author fields',()=>{
        expect(createCommentRequestSchema.parse({text:' A question ',versionNumber:2})).toEqual({text:'A question',versionNumber:2,hasCooked:false});
        for(const extra of [{text:'   '},{text:'x'.repeat(2001)},{authorId:'another'},{parentId:'invalid'},{versionNumber:0},{hasCooked:'yes'}])expect(createCommentRequestSchema.safeParse({text:'A question',versionNumber:1,...extra}).success).toBe(false);
    });
    it('validates both parts of the chronological cursor and bounds page size',()=>{
        expect(commentListQuerySchema.parse({limit:'3',cursor:'2026-10-18T09:00:00.000Z|aa731c70-950a-4778-937a-b7185e1b4fae'}).limit).toBe(3);
        for(const cursor of ['bad','2026-99-99T09:00:00.000Z|aa731c70-950a-4778-937a-b7185e1b4fae','2026-10-18T09:00:00.000Z|00000000-0000-0000-0000-00000000000z'])expect(commentListQuerySchema.safeParse({cursor}).success).toBe(false);
        expect(commentListQuerySchema.safeParse({limit:500}).success).toBe(false);
    });
});
