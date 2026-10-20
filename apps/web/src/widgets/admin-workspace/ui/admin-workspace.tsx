'use client';
import { useId,useState } from 'react';
import { feedbackReviewStatuses,sensoryDimensions,type AdminSection,type AdminFeedbackPage,type AdminRecipePage } from '@flavorpilot/contracts';
import type { AdminController } from '@/features/administration';
import { ingredientById,preparationById } from '@/entities/ingredient';
import { getDictionary,formatNumber,type Locale } from '@/shared/i18n';
import { Badge,Button,Dialog,LinkButton,Notice,Skeleton,WidgetFrame } from '@/shared/ui';
type RecipeRow=AdminRecipePage['items'][number];
type FeedbackRow=AdminFeedbackPage['items'][number];
export function AdminWorkspace({controller:c,section,locale}:{controller:AdminController;section:AdminSection;locale:Locale}) {
    const t=getDictionary(locale).messages,d=getDictionary(locale),id=useId();
    const [recipe,setRecipe]=useState<RecipeRow|null>(null),[feedback,setFeedback]=useState<FeedbackRow|null>(null);
    const page=c.data.users ?? c.data.recipes ?? c.data.catalogue ?? c.data.feedback ?? c.data.audit;
    const error=c.error==='crmConflict' ? t.crmConflict : c.error==='crmDenied' ? t.crmDenied : t.crmError;
    const reviews={new:t.crmReviewNew,reviewing:t.crmReviewing,needs_check:t.crmNeedsCheck,closed:t.crmReviewClosed};
    const agreements={matches:t.feedbackMatches,partial:t.feedbackPartial,missed:t.feedbackMissed};
    const titles={overview:t.crmOverview,users:t.crmUsers,recipes:t.crmRecipes,catalogue:t.crmCatalogue,feedback:t.crmFeedback,support:t.crmSupport,audit:t.crmAudit,service:t.crmService};
    const when=(value:string)=>new Date(value).toLocaleString(locale==='uk' ? 'uk-UA' : 'en-GB');
    return <WidgetFrame id="admin-workspace" title={titles[section]} icon="book" action={<Button disabled={c.busy || c.loading} onClick={c.retry}>{t.crmRefresh}</Button>}>
      {c.notice && <Notice tone="success">{t.crmSaved}</Notice>}
      {c.error && <Notice tone="error" role="alert">{error}</Notice>}
      {section==='recipes' || section==='users' ? <p className="small muted">{t.crmPrivacy}</p> : section==='feedback' ? <Notice>{t.crmFeedbackNote}</Notice> : section==='catalogue' ? <Notice>{t.crmCatalogueNote}</Notice> : null}
      {!['overview','service','support'].includes(section) && <form className="crm-search" onSubmit={e=>{e.preventDefault();c.applySearch();}}>
        <label htmlFor={`${id}-search`} className="sr-only">{t.crmSearch}</label><input id={`${id}-search`} maxLength={100} value={c.search} disabled={c.busy} onChange={e=>c.setSearch(e.target.value)}/><Button type="submit" disabled={c.busy || c.loading}>{t.crmSearch}</Button>
      </form>}
      {c.loading ? <Skeleton label={t.loading}/> : <>
      {c.data.overview && <><div className="crm-metrics">{([
        [t.crmTotalUsers,c.data.overview.users],[t.crmTotalRecipes,c.data.overview.recipes],[t.crmPublicRecipes,c.data.overview.publicRecipes],
        [t.crmHiddenRecipes,c.data.overview.hiddenRecipes],[t.crmSharedFeedback,c.data.overview.sharedFeedback],
        [t.crmUnreviewedFeedback,c.data.overview.unreviewedFeedback],[t.crmOpenTickets,c.data.overview.openTickets],[t.crmCatalogueCount,c.data.overview.catalogue],
      ] as const).map(([label,n])=><div key={label}><span>{label}</span><strong>{formatNumber(n,locale,0)}</strong></div>)}</div>
        <p className="muted small">{t.crmSourceNote}</p><Versions model={c.data.overview.modelVersion} catalogue={c.data.overview.catalogueVersion} locale={locale}/><p className="small muted">{t.crmCheckedAt}: {when(c.data.overview.checkedAt)}</p></>}
      <div className="crm-records">
        {c.data.users?.items.map(user=><article className="crm-record" key={user.id}><div><strong>{user.displayName || user.username}</strong><small>{user.username} · {user.locale} · {when(user.createdAt)}</small></div><Button disabled={c.busy} onClick={()=>void c.user(user.id)}>{t.crmOpen}</Button></article>)}
        {c.data.recipes?.items.map(r=><article className="crm-record" key={r.id}><div><strong>{r.name}</strong><small>{r.ownerUsername} · {t.crmVersion} {r.versionNumber}</small><Badge tone={r.moderationHidden ? 'amber' : 'green'}>{r.moderationHidden ? t.crmHidden : t.crmVisible}</Badge></div><div className="inline-actions">{!r.moderationHidden && <LinkButton href={`/${locale}/dishes/${r.id}`}>{t.crmOpen}</LinkButton>}<Button disabled={c.busy} onClick={()=>setRecipe(r)}>{r.moderationHidden ? t.crmRestore : t.crmHide}</Button></div></article>)}
        {c.data.catalogue?.items.map(item=><details className="crm-record-detail" key={item.id}><summary><strong>{item.name[locale]}</strong><span className="muted">{item.category[locale]} · {item.id}</span></summary><div className="stack">
          <Badge>{t.crmUnreviewed}</Badge><p>{t.preparation}: {item.preparations.map(p=>p.name[locale]).join(', ')}</p>
          <h3>{t.crmProfile}</h3><dl className="crm-facts">{sensoryDimensions.map(axis=><div key={axis}><dt>{d.dimensions[axis]}</dt><dd>{formatNumber(item.profile[axis],locale)}</dd></div>)}</dl>
          <p>{t.crmShare}: {[item.share.min,item.share.ideal,item.share.max].map(n=>formatNumber(n,locale)).join(' / ')} %</p>
          <h3>{t.crmPer100g}</h3><dl className="crm-facts">{([['protein',t.crmNutrientProtein],['fat',t.crmNutrientFat],['carbohydrate',t.crmNutrientCarbohydrate],['sugars',t.crmNutrientSugars],['sodium',t.crmNutrientSodium],['energy',t.crmNutrientEnergy]] as const).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{item.nutrients[key]===null ? t.crmMissing : formatNumber(item.nutrients[key],locale,2)}</dd></div>)}</dl>
          {item.source ? <p><a href={item.source.url} target="_blank" rel="noreferrer">{t.crmSource} · {item.source.fdcId}</a><br/>{item.source.description}</p> : <p>{t.crmMissing}</p>}
        </div></details>)}
        {c.data.feedback?.items.map(f=><article className="crm-record" key={f.id}><div><strong>{f.recipe.name || t.recipeUntitled}</strong><small>{f.cooked ? t.crmCooked : t.crmNotCooked} · {agreements[f.agreement]} · {reviews[f.review.status]}</small><span>{f.analysis.overallScore===null?t.unknown:`${f.analysis.overallScore}/100`}</span></div><Button disabled={c.busy} onClick={()=>setFeedback(f)}>{t.crmOpen}</Button></article>)}
        {c.data.audit?.items.map(event=><article className="crm-record crm-audit" key={event.id}><div><strong>{t.crmAuditAction}: <code>{event.action}</code></strong><small>{when(event.createdAt)}</small><p>{t.crmAuditActor}: <code>{event.actorId ?? '—'}</code></p>{event.targetId && <p>{t.crmAuditTarget}: <code>{event.targetId}</code></p>}{event.reason && <p>{t.crmAuditReason}: {event.reason}</p>}</div></article>)}
      </div>
      {page?.total===0 && <p>{t.crmEmpty}</p>}
      {c.data.service && <><Notice>{t.crmServiceNote}</Notice><dl className="crm-facts crm-service">
        {([
          [t.crmEnvironment,c.data.service.environment],[t.crmDatabase,c.data.service.database==='connected' ? t.crmConnected : c.data.service.database==='unavailable' ? t.crmUnavailable : t.crmNotConfigured],
          [t.crmAuth,c.data.service.authConfigured ? t.crmConfigured : t.crmNotConfigured],[t.crmAi,c.data.service.aiEnabled ? t.crmEnabled : t.crmDisabled],
          [t.crmBilling,t.crmNotConnected],[t.crmBackups,t.crmNotMonitored],[t.crmCheckedAt,when(c.data.service.checkedAt)],
          ...(c.data.service.aiUsage?[
            [t.crmAiUsage,c.data.service.aiUsage.model],[t.crmAiRequests,c.data.service.aiUsage.requests],[t.crmAiErrors,c.data.service.aiUsage.errors],
            [t.crmAiUnknown,c.data.service.aiUsage.unknown],[t.crmAiInput,c.data.service.aiUsage.inputTokens],[t.crmAiOutput,c.data.service.aiUsage.outputTokens],
            [t.crmAiReasoning,c.data.service.aiUsage.reasoningTokens],[t.crmAiSpent,c.data.service.aiUsage.spentUsd],[t.crmAiReserved,c.data.service.aiUsage.reservedUsd],
            [t.crmAiBudget,c.data.service.aiUsage.monthlyBudgetUsd],[t.crmAiDailyBudget,c.data.service.aiUsage.dailyBudgetUsd],
            [t.crmAiBudgetRemaining,Math.max(0,c.data.service.aiUsage.monthlyBudgetUsd-c.data.service.aiUsage.spentUsd-c.data.service.aiUsage.reservedUsd)],[t.crmAiLatency,c.data.service.aiUsage.averageLatencyMs],
          ]:[]),
        ] as const).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{typeof value==='number'?formatNumber(value,locale,6):value}</dd></div>)}</dl><Versions model={c.data.service.modelVersion} catalogue={c.data.service.catalogueVersion} locale={locale}/></>}
      </>}
      {page && <div className="crm-paging"><Button disabled={c.page===1 || c.loading || c.busy} onClick={()=>c.setPage(c.page-1)}>{t.crmPrevious}</Button><span>{c.page} · {page.total}</span><Button disabled={c.page*page.limit>=page.total || c.loading || c.busy} onClick={()=>c.setPage(c.page+1)}>{t.crmNext}</Button></div>}
      <Dialog open={Boolean(c.data.user)} title={c.data.user?.profile.displayName || c.data.user?.profile.username || t.crmUsers} closeLabel={t.close} onClose={c.closeUser}>
        {c.data.user && <><p className="small muted">{t.crmPrivacy}</p><dl className="crm-facts">{([
          [t.crmRegistered,when(c.data.user.profile.createdAt)],[t.crmLocale,c.data.user.profile.locale],[t.crmAllRecipes,c.data.user.recipeCount],
          [t.crmPublicCount,c.data.user.publicRecipeCount],[t.crmUserFeedback,c.data.user.feedbackCount],[t.crmUserTickets,c.data.user.ticketCount],
        ] as const).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <h3>{t.crmSubscription}</h3><p>{c.data.user.subscription ? `${c.data.user.subscription.tier} · ${c.data.user.subscription.status}` : t.crmNoSubscription}</p>
        <h3>{t.crmRecipes}</h3><p className="small muted">{t.crmPublicLimit}</p>{c.data.user.publicRecipes.map(r=><p key={r.id}>{r.name} · {r.moderationHidden ? t.crmHidden : t.crmVisible}</p>)}</>}
      </Dialog>
      <Dialog open={Boolean(recipe)} title={t.crmModerateTitle} closeLabel={t.close} onClose={()=>{if(!c.busy)setRecipe(null);}}>
        {recipe && <ModerationForm recipe={recipe} locale={locale} busy={c.busy} error={c.error ? error : ''} onSave={reason=>c.moderate(recipe.id,{reason,hidden:!recipe.moderationHidden,expectedHidden:recipe.moderationHidden,expectedRevision:recipe.moderationRevision}).then(ok=>{if(ok)setRecipe(null);})}/>}
      </Dialog>
      <Dialog open={Boolean(feedback)} title={t.crmReviewTitle} closeLabel={t.close} onClose={()=>{if(!c.busy)setFeedback(null);}}>
        {feedback && <FeedbackForm feedback={feedback} locale={locale} busy={c.busy} error={c.error ? error : ''} onSave={body=>c.review(feedback.id,body).then(ok=>{if(ok)setFeedback(null);})}/>}
      </Dialog>
    </WidgetFrame>;
}
function Versions({model,catalogue,locale}:{model:string;catalogue:string;locale:Locale}) {
    const t=getDictionary(locale).messages;return <p className="small muted">{t.crmModelVersion}: {model}<br/>{t.crmCatalogueVersion}: {catalogue}</p>;
}
function ModerationForm({recipe,locale,busy,error,onSave}:{recipe:RecipeRow;locale:Locale;busy:boolean;error:string;onSave:(reason:string)=>Promise<void>}) {
    const t=getDictionary(locale).messages,id=useId(),[reason,setReason]=useState('');
    return <form className="stack" onSubmit={e=>{e.preventDefault();void onSave(reason);}}><h3>{recipe.name}</h3><p>{t.crmModerateNote}</p>
      <label htmlFor={id}>{t.crmReason}</label><textarea id={id} maxLength={500} rows={3} disabled={busy} value={reason} onChange={e=>setReason(e.target.value)}/>
      {error && <Notice tone="error" role="alert">{error}</Notice>}<Button type="submit" variant="primary" disabled={busy || reason.trim().length<5}>{busy ? t.busy : recipe.moderationHidden ? t.crmRestore : t.crmHide}</Button></form>;
}
function FeedbackForm({feedback:f,locale,busy,error,onSave}:{feedback:FeedbackRow;locale:Locale;busy:boolean;error:string;onSave:(body:Parameters<AdminController['review']>[1])=>Promise<void>}) {
    const t=getDictionary(locale).messages,id=useId(),[status,setStatus]=useState(f.review.status),[note,setNote]=useState(f.review.note);
    const statuses={new:t.crmReviewNew,reviewing:t.crmReviewing,needs_check:t.crmNeedsCheck,closed:t.crmReviewClosed};
    const scores:Array<[string,number|null]>=f.analysis.ingredientAssessment?[[t.overall,f.analysis.overallScore],[t.assessedCompatibility,f.analysis.compatibilityScore],[t.balance,f.analysis.balanceScore],[t.texture,f.analysis.textureScore]]:[[t.legacyOverall,f.analysis.overallScore],[t.legacyCompatibility,f.analysis.compatibilityScore],[t.legacyBalance,f.analysis.balanceScore],[t.legacyQuantity,f.analysis.quantityScore],[t.legacyTexture,f.analysis.textureScore]];
    return <form className="stack" onSubmit={e=>{e.preventDefault();void onSave({status,note,expectedRevision:f.review.revision,expectedUpdatedAt:f.updatedAt});}}>
      <h3>{f.recipe.name || t.recipeUntitled}</h3><Badge>{f.cooked ? t.crmCooked : t.crmNotCooked}</Badge>
      <p>{({matches:t.feedbackMatches,partial:t.feedbackPartial,missed:t.feedbackMissed})[f.agreement]}{f.concerns.length ? ` · ${f.concerns.map(c=>t[c]).join(', ')}` : ''}</p>
      <dl className="crm-facts">{scores.filter(([label])=>!f.analysis.ingredientAssessment||label!==t.quantity).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value===null?t.unknown:`${value}/100`}</dd></div>)}</dl>
      <Versions model={f.modelVersion} catalogue={f.catalogueVersion} locale={locale}/>
      <ul>{f.recipe.items.map((i,n)=><li key={n}>{ingredientById.get(i.ingredientId)?.name[locale] ?? i.ingredientId} · {formatNumber(i.grams,locale)} {t.grams} · {preparationById.get(i.preparationId)?.name[locale] ?? i.preparationId}</li>)}</ul>
      {f.recipe.description && <p className="recipe-reading">{f.recipe.description}</p>}<ol>{f.recipe.steps.map(s=><li className="recipe-reading" key={s.id}>{s.text}</li>)}</ol>
      <h3>{t.crmAuthorNote}</h3><p className="recipe-reading">{f.note || '—'}</p>
      <label htmlFor={`${id}-status`}>{t.crmStatus}</label><select id={`${id}-status`} disabled={busy} value={status} onChange={e=>{const s=feedbackReviewStatuses.find(s=>s===e.target.value);if(s)setStatus(s);}}>{feedbackReviewStatuses.map(s=><option value={s} key={s}>{statuses[s]}</option>)}</select>
      <label htmlFor={`${id}-note`}>{t.crmReviewNote}</label><textarea id={`${id}-note`} rows={3} maxLength={2000} disabled={busy} value={note} onChange={e=>setNote(e.target.value)}/>
      {error && <Notice tone="error" role="alert">{error}</Notice>}<Button type="submit" variant="primary" disabled={busy}>{busy ? t.busy : t.crmReviewSave}</Button>
    </form>;
}
