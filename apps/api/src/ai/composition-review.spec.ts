import {describe,it,expect} from 'vitest';
import {aiExplainRequestSchema} from '@flavorpilot/contracts';
import {analyzeDish} from '@flavorpilot/flavor-engine';
import {compositionContext,finalizeComposition} from './composition-review';

const input=aiExplainRequestSchema.parse({locale:'en',dishName:'Test composition',includeCompositionReview:true,goal:'fresh',description:'Serve as a warm salad.',steps:[],items:[{ingredientId:'chicken',grams:134,preparationId:'seared'},{ingredientId:'corn',grams:53,preparationId:'grilled'},{ingredientId:'lime',grams:7.7,preparationId:'sauce'},{ingredientId:'cherry',grams:24,preparationId:'raw'},{ingredientId:'dill_pickle',grams:24.3,preparationId:'raw'}]});
const analysis=analyzeDish(input.items,input.goal,true),context=compositionContext(input,analysis);
const draft=()=>({summary:'A savoury base with fruit and a sharp finish.',strengths:[{ingredientIds:['chicken','corn'],observation:'Browning links the chicken and corn.',reason:'Their roasted notes provide a shared base.'}],risks:[{ingredientIds:['lime','dill_pickle'],observation:'The sharp components may compete.',reason:'Both contribute acidity to the same bite.'}],actions:[{kind:'technique',ingredientIds:['lime','dill_pickle'],candidateId:null,riskIndex:0,title:'Stage the sharp additions',instruction:'Finish with lime after tasting the pickle with the dish.',reason:'Their acidity may overlap.',expectedEffect:'Keep the grilled notes distinct.'}],missingContext:[]});

describe('grounded composition review',()=>{
 it('includes prepared profiles, named product state, goal, recipe and bounded pair/candidate evidence',()=>{
  expect(context.goal).toBe('fresh');expect('recipe' in context).toBe(false);expect(context.items.find(i=>i.ingredientId==='dill_pickle')?.name).toBe('Dill pickle');
  expect(context.items[0].preparedModelProfile).toEqual(analyzeDish([input.items[0]],input.goal,false).profile);
  expect(context.evidence.pairs.lowest).toHaveLength(0);expect(context.evidence.pairs.unknownCount).toBe(10);expect(context.evidence.scores.compatibilityIndex).toBeNull();
  expect(context.optionalAdditionTrials.length).toBeLessThanOrEqual(6);
 });
 it('accepts existing-ingredient advice and a genuine no-change result without filling additions',()=>{
  const result=finalizeComposition(draft(),input,context);expect(result.composition?.actions[0].addition).toBeNull();expect(result.actions[0].title).toBe('Stage the sharp additions');
  const unchanged=finalizeComposition({...draft(),risks:[],actions:[]},input,context);expect(unchanged.composition?.actions).toEqual([]);expect(unchanged.main_problem).toBe('');
 });
 it('takes an exact addition dose only from a server engine candidate and requires a stated risk',()=>{
  const candidate=context.optionalAdditionTrials[0];expect(candidate).toBeDefined();
  const action={...draft().actions[0],kind:'add',candidateId:candidate.id,ingredientIds:[candidate.ingredientId,'chicken']};
  const result=finalizeComposition({...draft(),actions:[action]},input,context);
  expect(result.composition?.actions[0].addition).toEqual({ingredientId:candidate.ingredientId,preparationId:candidate.preparationId,grams:candidate.grams});
  const after=analyzeDish([...input.items,result.composition!.actions[0].addition!],input.goal,false);
  expect(candidate.modelChanges.overall).toBeNull();expect(after.balanceScore-analysis.balanceScore).toBe(candidate.modelChanges.goalFit);
  expect(()=>finalizeComposition({...draft(),actions:[{...action,riskIndex:null}]},input,context)).toThrow();
  expect(()=>finalizeComposition({...draft(),actions:[{...action,candidateId:'invented'}]},input,context)).toThrow();
  expect(()=>finalizeComposition({...draft(),actions:[{...action,grams:999}]},input,context)).toThrow();
 });
 it('rejects numerical narration, invented doses, unknown ingredients and dangling risk references',()=>{
  for(const summary of ['Overall score is 83.','Add 27 g chocolate.','Баланс ９５.'])expect(()=>finalizeComposition({...draft(),summary},input,context)).toThrow();
  expect(()=>finalizeComposition({...draft(),risks:[{...draft().risks[0],ingredientIds:['unknown']}]},input,context)).toThrow();
  expect(()=>finalizeComposition({...draft(),actions:[{...draft().actions[0],ingredientIds:['unknown']}]},input,context)).toThrow();
  expect(()=>finalizeComposition({...draft(),actions:[{...draft().actions[0],riskIndex:2}]},input,context)).toThrow();
 });
 it('does not allow an extra catalogue candidate to be smuggled into a technique or duplicate addition',()=>{
  const candidate=context.optionalAdditionTrials[0],action={...draft().actions[0],kind:'add',candidateId:candidate.id,ingredientIds:[candidate.ingredientId]};
  expect(()=>finalizeComposition({...draft(),actions:[{...action,kind:'technique'}]},input,context)).toThrow();
  expect(()=>finalizeComposition({...draft(),actions:[action,action]},input,context)).toThrow();
 });
});
