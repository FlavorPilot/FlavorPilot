'use client';
import { useSession } from '@/features/session';
import { useSupportDesk } from '@/features/support-desk';
import { SupportDesk } from '@/widgets/support-desk';
import { getDictionary,type Locale } from '@/shared/i18n';
import { LinkButton,Notice,Skeleton } from '@/shared/ui';
export function SupportScreen({locale}:{locale:Locale}) {
    const t=getDictionary(locale).messages,{session,loading}=useSession();
    return <div className="page-stack stack narrow"><header className="page-heading"><div><h1>{t.supportTitle}</h1><p className="muted">{t.supportIntro}</p></div></header>
      {loading ? <Skeleton label={t.loading}/> : session ? <SupportSession key={session.user.id} token={session.access_token} userId={session.user.id} locale={locale}/> : <Notice><p>{t.noSession}</p><LinkButton href={`/${locale}/sign-in`}>{t.signIn}</LinkButton></Notice>}
    </div>;
}
function SupportSession({token,userId,locale}:{token:string;userId:string;locale:Locale}) {
    const desk=useSupportDesk(token);return <SupportDesk desk={desk} locale={locale} userId={userId}/>;
}
