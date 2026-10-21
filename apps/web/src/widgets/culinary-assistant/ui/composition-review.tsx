import type { AiExplainResponse } from '@flavorpilot/contracts';
import { ingredientById,preparationById } from '@flavorpilot/flavor-engine';
import { formatNumber,getDictionary,type Locale } from '@/shared/i18n';

export function CompositionReview({value,locale,embedded=false}:{value:AiExplainResponse;locale:Locale;embedded?:boolean}){
 const t=getDictionary(locale).messages,c=value.composition;
 const Heading=embedded?'h4':'h3';
 if(!c)return <><p className="recipe-reading">{value.summary}</p><p className="recipe-reading">{value.main_problem}</p>{value.actions.map((a,i)=><div key={i}><strong>{a.title}</strong><p className="recipe-reading">{a.explanation}</p></div>)}</>;
 return <section className="stack" aria-label={t.aiCompositionResult}>
  <div><Heading>{t.aiCompositionVerdict}</Heading><p className="recipe-reading">{c.summary}</p></div>
  {!!c.strengths.length&&<div><Heading>{t.aiStrengths}</Heading>{c.strengths.map((o,i)=><div key={i}><strong className="recipe-reading">{o.observation}</strong><p className="recipe-reading">{o.reason}</p></div>)}</div>}
  {!!c.risks.length&&<div><Heading>{t.aiRisks}</Heading>{c.risks.map((o,i)=><div key={i}><strong className="recipe-reading">{o.observation}</strong><p className="recipe-reading">{o.reason}</p></div>)}</div>}
  <Heading>{t.aiCompositionPriorities}</Heading>
  {c.actions.length?c.actions.map((a,i)=><article className="notice ai-comment" key={i}>
   <strong className="recipe-reading">{a.title}</strong><p className="recipe-reading">{a.instruction}</p>
   {a.addition&&<p className="small">{t.aiAdditionTrial}: {ingredientById.get(a.addition.ingredientId)?.name[locale]} · {formatNumber(a.addition.grams,locale,1)} {t.grams} · {preparationById.get(a.addition.preparationId)?.name[locale]}</p>}
   <p className="recipe-reading"><strong>{t.aiActionReason}: </strong>{a.reason}</p>
   <p className="recipe-reading"><strong>{t.aiActionEffect}: </strong>{a.expectedEffect}</p>
  </article>):<p>{t.aiCompositionNoChanges}</p>}
  {!!c.missingContext.length&&<div><Heading>{t.aiAssumptions}</Heading><ul>{c.missingContext.map((text,i)=><li className="recipe-reading" key={i}>{text}</li>)}</ul></div>}
 </section>;
}
