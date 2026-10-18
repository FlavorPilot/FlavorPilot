import type { AiCapabilities,AiComment,AiExplainResponse,RecipeStep } from '@flavorpilot/contracts';
import { formatNumber,getDictionary,type Locale,type MessageKey } from '@/shared/i18n';
import { Button,Notice,WidgetFrame } from '@/shared/ui';
const errorKeys:Record<string,MessageKey>={AI_INPUT_TOO_LARGE:'aiInputTooLarge',AI_PLAN_REQUIRED:'aiPlanRequired',AI_DISABLED:'aiDisabled',AI_RATE_LIMITED:'aiRateLimited',AI_QUOTA_EXCEEDED:'aiQuotaExceeded',AI_BUDGET_EXCEEDED:'aiBudgetExceeded',AI_REQUEST_PENDING:'aiPending',AI_REQUEST_FINISHED:'aiFinished',AI_REQUEST_CONFLICT:'aiFinished',AI_RESPONSE_INCOMPLETE:'aiIncomplete'};
type State={signedIn:boolean;quota:AiCapabilities|null;busy:boolean;error:string;consent:boolean;automatic:boolean;available:boolean;activeStep:string;stale:boolean;comments:AiComment[];result:{kind:string;explanation?:AiExplainResponse}|null;run:(kind:'explain'|'step'|'full')=>void;apply:(comment:AiComment)=>void;dismiss:(id:string)=>void;setConsent:(v:boolean)=>void;setAutomatic:(v:boolean)=>void;setActiveStep:(v:string)=>void};
export function CulinaryAssistant({locale,state:s,view,steps,hasItems}:{locale:Locale;state:State;view:'explain'|'review';steps:RecipeStep[];hasItems:boolean}){
 const t=getDictionary(locale).messages;
 const keys={clarity:'aiClarity',consistency:'aiConsistency',ingredientUsage:'aiIngredientUsage',technique:'aiTechnique'} as const;
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
     <Button disabled={s.busy||!s.consent||!hasItems||!steps.some(step=>step.text.trim())||s.quota.remaining<4||s.quota.dailyRemaining<4} onClick={()=>s.run('full')}>{t.aiFullButton}</Button>
    </>}
   </div>
  </>}
  {s.busy&&<p role="status">{t.aiWorking}</p>}
  {s.error&&<Notice tone="error" role="alert">{t[errorKeys[s.error]??'aiUnavailable']}</Notice>}
  {visible&&<div className="stack" aria-live="polite">
   {s.stale&&<Notice tone="warning">{t.aiStale}</Notice>}
   {explain&&s.result?.explanation&&<><p className="recipe-reading">{s.result.explanation.summary}</p><p className="recipe-reading">{s.result.explanation.main_problem}</p>{s.result.explanation.actions.map((a,i)=><div key={i}><strong>{a.title}</strong><p className="recipe-reading">{a.explanation}</p></div>)}</>}
   {!explain&&(s.comments.length?s.comments.map(c=><article className="notice ai-comment" key={c.id}>
    <strong>{t[keys[c.kind]]}{c.stepId?` · ${t.recipeStep} ${formatNumber(steps.findIndex(step=>step.id===c.stepId)+1,locale,0)}`:''}</strong>
    <p className="recipe-reading">{c.message}</p>{c.suggestedText&&<blockquote className="recipe-reading">{c.suggestedText}</blockquote>}
    <div className="dialog__actions">{c.suggestedText&&<Button disabled={s.stale||s.busy} onClick={()=>s.apply(c)}>{t.aiApply}</Button>}<Button variant="ghost" onClick={()=>s.dismiss(c.id)}>{t.aiDismiss}</Button></div>
   </article>):<p>{t.aiNoComments}</p>)}
  </div>}
 </WidgetFrame>;
}
