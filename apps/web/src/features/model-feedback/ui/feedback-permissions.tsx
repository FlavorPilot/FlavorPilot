'use client';
import { useEffect,useRef,useState } from 'react';
import { feedbackRepository } from '@/entities/feedback';
import { getDictionary,type Locale } from '@/shared/i18n';
import { Badge,Button,Notice,Skeleton,WidgetFrame } from '@/shared/ui';
type Page=Awaited<ReturnType<typeof feedbackRepository.mine>>;
export function FeedbackPermissions({token,locale}:{token:string;locale:Locale}) {
    const t=getDictionary(locale).messages,[data,setData]=useState<Page|null>(null),[page,setPage]=useState(1),[attempt,retry]=useState(0),
        [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(false);
    const generation=useRef(0);
    useEffect(()=>{const c=new AbortController(),run=++generation.current;setLoading(true);setData(null);setError(false);
        feedbackRepository.mine(page,token,c.signal).then(value=>{if(!c.signal.aborted)setData(value);}).catch(()=>{if(!c.signal.aborted)setError(true);})
            .finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>{c.abort();if(generation.current===run)generation.current++;};
    },[token,page,attempt]);
    async function withdraw(id:string){const run=generation.current;setBusy(true);setError(false);
        try{await feedbackRepository.withdraw(id,token);if(run===generation.current)setData(d=>d ? {...d,items:d.items.map(f=>f.id===id ? {...f,allowTeamReview:false} : f)} : d);}
        catch{if(run===generation.current)setError(true);}finally{if(run===generation.current)setBusy(false);}
    }
    return <WidgetFrame id="feedback-permissions" title={t.feedbackPermissions} subtitle={t.feedbackPermissionsNote} icon="lock">
      {error && <Notice tone="error" role="alert"><p>{t.crmError}</p><Button onClick={()=>retry(v=>v+1)}>{t.retry}</Button></Notice>}
      {loading ? <Skeleton label={t.loading}/> : <div className="crm-records">{data?.items.map(f=><article className="crm-record" key={f.id}><div><strong>{f.name || t.recipeUntitled}</strong><small>{f.cooked ? t.crmCooked : t.crmNotCooked}</small><Badge>{f.allowTeamReview ? t.feedbackPermissionShared : t.feedbackPermissionPrivate}</Badge></div>{f.allowTeamReview && <Button disabled={busy} onClick={()=>void withdraw(f.id)}>{t.feedbackWithdraw}</Button>}</article>)}{data?.total===0 && <p>{t.crmEmpty}</p>}</div>}
      {data && <div className="crm-paging"><Button disabled={page===1 || busy || loading} onClick={()=>setPage(p=>p-1)}>{t.crmPrevious}</Button><span>{page} · {data.total}</span><Button disabled={page*data.limit>=data.total || busy || loading} onClick={()=>setPage(p=>p+1)}>{t.crmNext}</Button></div>}
    </WidgetFrame>;
}
