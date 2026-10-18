'use client';
import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminSections,type AdminSection } from '@flavorpilot/contracts';
import { useSession } from '@/features/session';
import { AdminMfa,useAdminAccess,useAdminData } from '@/features/administration';
import { useSupportDesk } from '@/features/support-desk';
import { AdminWorkspace } from '@/widgets/admin-workspace';
import { SupportDesk } from '@/widgets/support-desk';
import { getDictionary,type Locale } from '@/shared/i18n';
import { Button,LinkButton,Notice,Skeleton } from '@/shared/ui';
export function AdminScreen({locale}:{locale:Locale}) {
    const t=getDictionary(locale).messages,{session,client,loading}=useSession();
    return <div className="page-stack stack"><header className="page-heading"><div><p className="eyebrow">{t.brand}</p><h1>{t.crmTitle}</h1><p className="muted">{t.crmIntro}</p></div></header>
      {loading ? <Skeleton label={t.loading}/> : session ? <AdminSession key={session.user.id} token={session.access_token} userId={session.user.id} client={client} locale={locale}/> : <Notice><p>{t.crmSignIn}</p><LinkButton href={`/${locale}/sign-in`}>{t.signIn}</LinkButton></Notice>}
    </div>;
}
function AdminSession({token,userId,client,locale}:{token:string;userId:string;client:SupabaseClient|null;locale:Locale}) {
    const t=getDictionary(locale).messages,access=useAdminAccess(token),[section,setSection]=useState<AdminSection>('overview');
    const titles={overview:t.crmOverview,users:t.crmUsers,recipes:t.crmRecipes,catalogue:t.crmCatalogue,feedback:t.crmFeedback,support:t.crmSupport,audit:t.crmAudit,service:t.crmService};
    if(access.loading)return <Skeleton label={t.loading}/>;
    if(!access.access)return <Notice tone="error" role="alert"><p>{access.error==='crmDenied' ? t.crmDenied : t.crmError}</p><Button onClick={access.retry}>{t.crmRetry}</Button></Notice>;
    if(access.access.mfaRequired && !access.access.mfaVerified)return client ? <AdminMfa client={client} locale={locale} onVerified={access.retry}/> : <Notice tone="error">{t.crmMfaError}</Notice>;
    return <div className="crm-layout"><nav className="crm-nav" aria-label={t.crmTitle}>{adminSections.map(s=><button key={s} type="button" aria-current={section===s ? 'page' : undefined} onClick={()=>setSection(s)}>{titles[s]}</button>)}</nav><div className="crm-content">
      {section==='support' ? <AdminSupport key={userId} token={token} userId={userId} locale={locale}/> : <AdminPane key={section} token={token} section={section} locale={locale}/>}
    </div></div>;
}
function AdminPane({token,section,locale}:{token:string;section:AdminSection;locale:Locale}) {
    const controller=useAdminData(token,section),t=getDictionary(locale).messages;
    if(controller.error==='crmDenied')return <Notice tone="error" role="alert"><p>{t.crmDenied}</p><Button onClick={controller.retry}>{t.crmRetry}</Button></Notice>;
    return <AdminWorkspace controller={controller} section={section} locale={locale}/>;
}
function AdminSupport({token,userId,locale}:{token:string;userId:string;locale:Locale}) {
    const desk=useSupportDesk(token,true),t=getDictionary(locale).messages;
    if(desk.error==='crmDenied')return <Notice tone="error" role="alert">{t.crmDenied}</Notice>;
    return <SupportDesk desk={desk} locale={locale} staff userId={userId}/>;
}
