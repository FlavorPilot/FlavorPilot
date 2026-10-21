import { aiCompositionDraftSchema, aiExplainResponseSchema, type AiExplainRequest, type DishAnalysis } from '@flavorpilot/contracts';
import { analyzeDish, ingredientById, preparationById,preparedTextureTags } from '@flavorpilot/flavor-engine';

export function compositionContext(input:AiExplainRequest,analysis:DishAnalysis){
 const items=input.items.map(item=>{
  const ingredient=ingredientById.get(item.ingredientId)!,preparation=preparationById.get(item.preparationId)!;
  return {...item,name:ingredient.name[input.locale],preparation:preparation.name[input.locale],roles:ingredient.roles,
   textures:preparedTextureTags(ingredient.textures,preparation.addTextures,item.preparationId),
   aromas:[...new Set([...ingredient.aromas,...(preparation.addAromas??[])])].slice(0,4),
   preparedModelProfile:analyzeDish([item],input.goal,false).profile};
 });
 const pairs=analysis.pairResults.filter((p):p is typeof p & {score:number}=>p.score!==null).sort((a,b)=>a.score-b.score);
 const candidates=analysis.recommendations.slice(0,6).map((candidate,index)=>({
  id:`addition:${index}`,ingredientId:candidate.ingredientId,name:ingredientById.get(candidate.ingredientId)!.name[input.locale],
  preparationId:candidate.preparationId,preparation:preparationById.get(candidate.preparationId)!.name[input.locale],
  grams:candidate.recommendedGrams,modelChanges:{overall:candidate.overallDelta,goalFit:candidate.balanceDelta,profile:candidate.profileChanges}
 }));
 return {dishName:input.dishName,goal:input.goal,items,
  evidence:{status:'unreviewed culinary hypotheses, not measured taste or causal evidence',scores:{overall:analysis.overallScore,compatibility:analysis.compatibilityScore,balance:analysis.balanceScore,proportions:analysis.quantityScore,texture:analysis.textureScore},profile:analysis.profile,issues:analysis.issues,
   pairs:{lowest:pairs.slice(0,3),highest:pairs.slice(-3).reverse(),inferredCount:analysis.pairResults.filter(p=>p.evidence==='inferred').length}},
  optionalAdditionTrials:candidates};
}

// Strict IDs/doses are a server boundary. Sensory claims still require human evaluation.
export function finalizeComposition(value:unknown,input:AiExplainRequest,context:ReturnType<typeof compositionContext>){
 const draft=aiCompositionDraftSchema.parse(value),selected=new Set(input.items.map(i=>i.ingredientId));
 const prose=[draft.summary,...draft.missingContext,...[...draft.strengths,...draft.risks].flatMap(o=>[o.observation,o.reason]),...draft.actions.flatMap(a=>[a.title,a.instruction,a.reason,a.expectedEffect])];
 // Numerical scores and exact doses are rendered from engine metadata, never model prose.
 if(prose.some(text=>/\p{N}/u.test(text)))throw new Error('Numerical prose is not permitted in composition review');
 for(const observation of [...draft.strengths,...draft.risks])if(observation.ingredientIds.some(id=>!selected.has(id)))throw new Error('Unknown observation ingredient');
 const used=new Set<string>();
 const actions=draft.actions.map(action=>{
  if(action.riskIndex!==null&&!draft.risks[action.riskIndex])throw new Error('Unknown risk reference');
  const candidate=action.candidateId===null?undefined:context.optionalAdditionTrials.find(c=>c.id===action.candidateId);
  if(action.kind==='add'){
   if(!candidate||action.riskIndex===null||!action.ingredientIds.includes(candidate.ingredientId)||used.has(candidate.id))throw new Error('Addition requires a unique engine candidate and a specific risk');
   used.add(candidate.id);
  }else if(action.candidateId!==null)throw new Error('Only additions can use an addition candidate');
  const allowed=new Set([...selected,...(action.kind==='add'&&candidate?[candidate.ingredientId]:[])]);
  if(action.ingredientIds.some(id=>!allowed.has(id)))throw new Error('Unknown action ingredient');
  return {...action,addition:action.kind==='add'&&candidate?{ingredientId:candidate.ingredientId,preparationId:candidate.preparationId,grams:candidate.grams}:null};
 });
 const composition={...draft,actions};
 return aiExplainResponseSchema.parse({summary:draft.summary,main_problem:draft.risks[0]?.observation??'',
  actions:actions.map(action=>({title:action.title,explanation:`${action.instruction}\n${action.reason}\n${action.expectedEffect}`})),composition});
}

export const COMPOSITION_TASK=`Review ingredient selection, amounts, selected per-ingredient preparation and sensory direction only. Cooking workflow and finished-dish evaluation belong to the separate recipe stage. Do not infer coating, marinade or serving groups as established facts, request recipe steps here, prescribe cooking procedures or grade the finished dish. Pair scores are profile-based model hypotheses, sometimes supplemented by an explicit catalogue adjustment. An absent adjustment does not mean an unscored or invalid pair. High model proportions do not prove suitable real-world quantities. Do not narrate scores, profile numbers, or a catalogue of possible additions.
Return a short verdict describing the ingredient profile and supported interactions, followed by specific strengths and risks. Each observation must name the actual ingredients involved and explain a sensory interaction: taste, aroma, texture, moisture or proportion. Ground claims in ingredient identities, amounts, selected per-ingredient treatment and goal. Actual assembly is unknown at this stage. Treat model profiles and pair scores as experimental hints: a low pair score alone is not proof of a bad combination. Read preserved food names literally; raw means no additional processing, not that a named preserved product becomes fresh or unpickled. A generic sauce label does not reveal its recipe. Aroma and texture tags are model hypotheses too, not verified product properties. Do not assume unspecified fermentation, curing, brine ingredients or sauce composition; use broad sensory language when these details are unknown. Put missing-detail caveats only in missingContext, never repeat them in the verdict or every paragraph. Avoid generic phrases such as it depends on how it is combined; give a direct, concise culinary conclusion instead.
Give zero to three priority actions with concrete instruction, culinary reason and expected sensory effect. Prefer keeping, reducing or removing existing ingredients or changing a selected ingredient treatment when that solves the problem. Non-add actions reference only selected ingredientIds and candidateId=null; reductions are qualitative trials, never fabricated exact amounts or score improvements. Empty actions and risks are valid when no change is justified. Do not invent problems to fill the schema.
An addition is optional and must solve a specific listed risk, referenced by its zero-based riskIndex. Select candidateId from optionalAdditionTrials and include that ingredientId. A positive change in fit to the selected profile is not sufficient justification: explain how it fits this dish, why it is preferable to changing existing ingredients, and any trade-off. Reject redundant or stylistically incoherent candidates. Do not pad to three suggestions; it is fine to reject every candidate.
All human-readable text must contain no numbers: scores and exact candidate amounts are displayed separately by the application. Avoid time or temperature prescriptions in this composition review. Never claim a change has already been made. Keep each observation/reason and action field to one short sentence. Do not repeat the same explanation across fields.`;
