import {useState} from 'react';
import type { AiCapabilities,AiComment,AiExplainResponse,AiDishOutcome,AiGeneratedRecipe,RecipeStep } from '@flavorpilot/contracts';
import { formatNumber,getDictionary,type Locale,type MessageKey } from '@/shared/i18n';
import { Badge,Button,Dialog,Notice,WidgetFrame } from '@/shared/ui';
const errorKeys:Record<string,MessageKey>={AI_INPUT_TOO_LARGE:'aiInputTooLarge',AI_PLAN_REQUIRED:'aiPlanRequired',AI_DISABLED:'aiDisabled',AI_RATE_LIMITED:'aiRateLimited',AI_QUOTA_EXCEEDED:'aiQuotaExceeded',AI_BUDGET_EXCEEDED:'aiBudgetExceeded',AI_REQUEST_PENDING:'aiPending',AI_REQUEST_FINISHED:'aiFinished',AI_REQUEST_CONFLICT:'aiFinished',AI_RESPONSE_INCOMPLETE:'aiIncomplete'};
type State={signedIn:boolean;quota:AiCapabilities|null;busy:boolean;error:string;consent:boolean;automatic:boolean;available:boolean;activeStep:string;stale:boolean;comments:AiComment[];result:{kind:string;explanation?:AiExplainResponse}|null;run:(kind:'explain'|'step'|'full'|'generate')=>void;apply:(comment:AiComment)=>void;dismiss:(id:string)=>void;setConsent:(v:boolean)=>void;setAutomatic:(v:boolean)=>void;setActiveStep:(v:string)=>void;assessment:AiDishOutcome|null;assessmentStale:boolean;generation:{recipe:AiGeneratedRecipe;assumptions:string[]}|null;generationStale:boolean;generationBrief:string;setGenerationBrief:(v:string)=>void;applyRecipe:()=>void};
export function CulinaryAssistant({locale,state:s,view,steps,hasItems}:{locale:Locale;state:State;view:'explain'|'review';steps:RecipeStep[];hasItems:boolean}){
 const t=getDictionary(locale).messages;
 const [confirmRecipe,setConfirmRecipe]=useState(false);
 const keys={clarity:'aiClarity',consistency:'aiConsistency',ingredientUsage:'aiIngredientUsage',technique:'aiTechnique'} as const;
 const verdicts={promising:'aiVerdictPromising',mixed:'aiVerdictMixed',needsWork:'aiVerdictNeedsWork',insufficientContext:'aiVerdictInsufficient'} as const;
 const explain=view==='explain',visible=s.result&&(explain?s.result.kind==='explain':s.result.kind!=='explain');
 return <WidgetFrame id={`culinary-${view}`} title={explain?t.aiExplainTitle:t.aiReviewTitle} icon="spark">
  <p className="small muted">{explain?t.aiExplainHint:t.aiReviewHint}</p>
  {!s.quota ? <p>{s.signedIn?(s.error?t.aiUnavailable:t.loading):t.aiConnect}</p> : !s.quota.enabled ? <Notice>{t.aiDisabled}</Notice> : s.quota.access==='none' ? <Notice>{t.aiPlanRequired}</Notice> : <>
   {s.quota.access==='pilot'&&<p className="small">{t.aiPilot}</p>}
   <p className="small">{t.aiRemaining}: {formatNumber(s.quota.remaining,locale,0)} · {t.aiDailyRemaining}: {formatNumber(s.quota.dailyRemaining,locale,0)}</p>
   <p className="small muted">{t.aiMonthlyReset}: {new Date(s.quota.resetAt).toLocaleString(locale==='uk'?'uk-UA':'en-GB',{timeZone:'UTC'})} UTC<br/>{t.aiDailyReset}: {new Date(s.quota.dailyResetAt).toLocaleString(locale==='uk'?'uk-UA':'en-GB',{timeZone:'UTC'})} UTC</p>
   <label className="check-label"><input type="checkbox" checked={s.consent} onChange={e=>s.setConsent(e.target.checked)}/><span>{t.aiConsent}</span></label>
   {!explain&&<>
    <label className="field-label">{t.aiActiveStep}<select value={s.activeStep} onChange={e=>s.setActiveStep(e.target.value)}><option value="">{t.aiChooseStep}</option>{steps.map((step,i)=><option key={step.id} value={step.id}>{t.recipeStep} {formatNumber(i+1,locale,0)}</option>)}</select></label>
    <label className="check-label"><input type="checkbox" checked={s.automatic} disabled={!s.consent} onChange={e=>s.setAutomatic(e.target.checked)}/><span>{t.aiAutomatic}</span></label>
    <p className="small muted">{t.aiAutomaticHint}</p>
   </>}
   <div className="dialog__actions">
    {explain?<Button disabled={s.busy||!s.consent||!hasItems||s.quota.remaining<2||s.quota.dailyRemaining<2} onClick={()=>s.run('explain')}>{t.aiExplainButton}</Button>:<>
     <Button disabled={s.busy||!s.consent||!hasItems||!steps.some(step=>step.id===s.activeStep&&step.text.trim())||s.quota.remaining<1||s.quota.dailyRemaining<1} onClick={()=>s.run('step')}>{t.aiStepButton}</Button>
     <Button disabled={s.busy||!s.consent||!hasItems||s.quota.remaining<4||s.quota.dailyRemaining<4} onClick={()=>s.run('full')}>{t.aiFullButton}</Button>
    </>}
   </div>
   {!explain&&<div className="stack">
    <label className="field-label">{t.aiGenerationBrief}<textarea value={s.generationBrief} maxLength={1000} disabled={s.busy} rows={3} onChange={e=>s.setGenerationBrief(e.target.value)}/></label>
    <p className="small muted">{t.aiGenerateHint}</p>
    <Button disabled={s.busy||!s.consent||!hasItems||s.quota.remaining<4||s.quota.dailyRemaining<4} onClick={()=>s.run('generate')}>{t.aiGenerateButton}</Button>
   </div>}
  </>}
  {s.busy&&<p role="status">{t.aiWorking}</p>}
  {s.error&&<Notice tone="error" role="alert">{t[errorKeys[s.error]??'aiUnavailable']}</Notice>}
  {!explain&&s.assessment&&<section className="stack ai-outcome" aria-label={t.aiOutcomeTitle} aria-live="polite">
   <h3>{t.aiOutcomeTitle}</h3><Badge>{t[verdicts[s.assessment.verdict]]}</Badge>
   <p className="small muted">{t.aiOutcomeHint}</p>{s.assessmentStale&&<Notice tone="warning">{t.aiStale}</Notice>}
   <p className="recipe-reading">{s.assessment.summary}</p>
   <div><h4>{t.aiTaste}</h4><p className="recipe-reading">{s.assessment.taste}</p></div>
   <div><h4>{t.aiTexture}</h4><p className="recipe-reading">{s.assessment.texture}</p></div>
   {!!s.assessment.strengths.length&&<div><h4>{t.aiStrengths}</h4><ul>{s.assessment.strengths.map((v,i)=><li className="recipe-reading" key={i}>{v}</li>)}</ul></div>}
   {!!s.assessment.risks.length&&<div><h4>{t.aiRisks}</h4><ul>{s.assessment.risks.map((v,i)=><li className="recipe-reading" key={i}>{v}</li>)}</ul></div>}
   <h4>{t.aiCookingAdvice}</h4>{s.assessment.cookingAdvice.map((a,i)=><article className="notice ai-comment" key={i}><strong>{a.title}</strong><p className="recipe-reading">{a.instruction}</p><p className="small recipe-reading">{a.reason}</p></article>)}
   {!!s.assessment.assumptions.length&&<div><h4>{t.aiAssumptions}</h4><ul>{s.assessment.assumptions.map((v,i)=><li className="recipe-reading" key={i}>{v}</li>)}</ul></div>}
  </section>}
  {!explain&&s.generation&&<section className="stack ai-generation" aria-label={t.aiGeneratedTitle} aria-live="polite">
   <h3>{t.aiGeneratedTitle}</h3>{s.generationStale&&<Notice tone="warning">{t.aiStale}</Notice>}
   <strong>{s.generation.recipe.name}</strong><p className="recipe-reading">{s.generation.recipe.description}</p>
   {s.generation.recipe.servings!==null&&<p>{t.recipeServings}: {formatNumber(s.generation.recipe.servings,locale,0)}</p>}
   <ol>{s.generation.recipe.steps.map(step=><li className="recipe-reading" key={step.id}>{step.text}</li>)}</ol>
   {!!s.generation.assumptions.length&&<div><h4>{t.aiAssumptions}</h4><ul>{s.generation.assumptions.map((v,i)=><li className="recipe-reading" key={i}>{v}</li>)}</ul></div>}
   <Button disabled={s.generationStale||s.busy} onClick={()=>setConfirmRecipe(true)}>{t.aiUseRecipe}</Button>
   {confirmRecipe&&<Dialog open title={t.aiReplaceTitle} closeLabel={t.close} onClose={()=>setConfirmRecipe(false)}><p>{t.aiReplaceHint}</p><div className="dialog__actions"><Button variant="ghost" onClick={()=>setConfirmRecipe(false)}>{t.cancel}</Button><Button disabled={s.generationStale||s.busy} onClick={()=>{s.applyRecipe();setConfirmRecipe(false);}}>{t.aiConfirmReplace}</Button></div></Dialog>}
  </section>}
  {visible&&<div className="stack" aria-live="polite">
   {s.stale&&<Notice tone="warning">{t.aiStale}</Notice>}
   {explain&&s.result?.explanation&&<><p className="recipe-reading">{s.result.explanation.summary}</p><p className="recipe-reading">{s.result.explanation.main_problem}</p>{s.result.explanation.actions.map((a,i)=><div key={i}><strong>{a.title}</strong><p className="recipe-reading">{a.explanation}</p></div>)}</>}
   {!explain&&<h3>{t.aiStepComments}</h3>}
   {!explain&&(s.comments.length?s.comments.map(c=><article className="notice ai-comment" key={c.id}>
    <strong>{t[keys[c.kind]]}{c.stepId?` · ${t.recipeStep} ${formatNumber(steps.findIndex(step=>step.id===c.stepId)+1,locale,0)}`:''}</strong>
    <p className="recipe-reading">{c.message}</p>{c.suggestedText&&<blockquote className="recipe-reading">{c.suggestedText}</blockquote>}
    <div className="dialog__actions">{c.suggestedText&&<Button disabled={s.stale||s.busy} onClick={()=>s.apply(c)}>{t.aiApply}</Button>}<Button variant="ghost" onClick={()=>s.dismiss(c.id)}>{t.aiDismiss}</Button></div>
   </article>):<p>{t.aiNoComments}</p>)}
  </div>}
 </WidgetFrame>;
}
