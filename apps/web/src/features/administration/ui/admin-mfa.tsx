'use client';
import { useEffect,useId,useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getDictionary,type Locale } from '@/shared/i18n';
import { Button,Notice,Skeleton } from '@/shared/ui';
export function AdminMfa({client,locale,onVerified}:{client:SupabaseClient;locale:Locale;onVerified:()=>void}) {
    const t=getDictionary(locale).messages,id=useId();
    const [factor,setFactor]=useState<string|null>(null),[qr,setQr]=useState(''),[secret,setSecret]=useState(''),[code,setCode]=useState('');
    const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(false);
    useEffect(()=>{let live=true;client.auth.mfa.listFactors().then(({data,error})=>{
        if(live){setFactor(data?.totp.find(f=>f.status==='verified')?.id ?? null);setError(Boolean(error));setLoading(false);}
    }).catch(()=>{if(live){setError(true);setLoading(false);}});return()=>{live=false;};},[client]);
    async function enroll(){setBusy(true);setError(false);try{
        const {data,error}=await client.auth.mfa.enroll({factorType:'totp',friendlyName:`FlavorPilot ${crypto.randomUUID().slice(0,8)}`});
        if(error || !data)throw error;setFactor(data.id);setQr(data.totp.qr_code);setSecret(data.totp.secret);
    }catch{setError(true);}finally{setBusy(false);}}
    async function verify(){if(!factor)return;setBusy(true);setError(false);try{
        const {error}=await client.auth.mfa.challengeAndVerify({factorId:factor,code});if(error)throw error;
        setCode('');setSecret('');setQr('');onVerified();
    }catch{setError(true);}finally{setBusy(false);}}
    return <div className="stack crm-mfa"><h2>{t.crmMfaTitle}</h2><p>{t.crmMfaText}</p>
      {loading ? <Skeleton label={t.loading}/> : !factor ? <Button disabled={busy} onClick={()=>void enroll()}>{t.crmMfaEnroll}</Button> : <>
      {qr && <img src={qr} alt={t.crmMfaQr} width={220} height={220}/>}{secret && <p className="crm-secret"><span>{t.crmMfaSecret}</span><code>{secret}</code></p>}
      <label htmlFor={id}>{t.crmMfaCode}</label><input id={id} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} disabled={busy} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/>
      <Button variant="primary" disabled={busy || code.length!==6} onClick={()=>void verify()}>{busy ? t.busy : t.crmMfaVerify}</Button></>}
      {error && <Notice tone="error" role="alert">{t.crmMfaError}</Notice>}
    </div>;
}
