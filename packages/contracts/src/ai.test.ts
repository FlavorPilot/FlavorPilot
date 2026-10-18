import {describe,it,expect} from 'vitest';
import {aiReviewRequestSchema,aiReviewResultSchema} from './ai';
const step='a1111111-1111-4111-8111-111111111111';
const request={requestId:'b1111111-1111-4111-8111-111111111111',locale:'uk',scope:'step',activeStepId:step,recipe:{name:'Recipe',goal:'balanced',items:[{ingredientId:'salmon',grams:100,preparationId:'raw'}],steps:[{id:step,text:'Prepare fish.'}]}};
describe('AI snapshot boundaries',()=>{
 it('requires a nonempty, existing active step and stable UUID request',()=>{
  expect(aiReviewRequestSchema.safeParse(request).success).toBe(true);
  expect(aiReviewRequestSchema.safeParse({...request,activeStepId:'c1111111-1111-4111-8111-111111111111'}).success).toBe(false);
  expect(aiReviewRequestSchema.safeParse({...request,recipe:{...request.recipe,steps:[{id:step,text:'   '}]}}).success).toBe(false);
  expect(aiReviewRequestSchema.safeParse({...request,requestId:'retry'}).success).toBe(false);
 });
 it('rejects client entitlements and limits generated comments',()=>{
  expect(aiReviewRequestSchema.safeParse({...request,tier:'pro'}).success).toBe(false);
  const comment={id:step,kind:'technique',stepId:step,message:'Explain this.',suggestedText:null};
  expect(aiReviewResultSchema.safeParse({comments:Array(7).fill(comment)}).success).toBe(false);
  expect(aiReviewResultSchema.safeParse({comments:[{...comment,kind:'publish'}]}).success).toBe(false);
 });
});
