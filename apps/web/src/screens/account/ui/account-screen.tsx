'use client';
import { useState } from 'react';
import { useSession } from '@/features/session';
import { hasApi } from '@/shared/config';
import { getDictionary, type Locale } from '@/shared/i18n';
import { Badge, Button, Icon, LinkButton, Notice, Skeleton, WidgetFrame } from '@/shared/ui';
export function AccountScreen({ locale }: {
    locale: Locale;
}) {
    const t = getDictionary(locale).messages;
    const { client, session, loading } = useSession();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    async function signOut() {
        if (!client)
            return;
        setBusy(true);
        setError(false);
        try {
            const result = await client.auth.signOut();
            if (result.error)
                throw result.error;
        }
        catch {
            setError(true);
        }
        finally {
            setBusy(false);
        }
    }
    return <div className="stack page-stack narrow"><header className="page-heading"><div><p className="eyebrow">{t.account}</p><h1>{t.accountTitle}</h1><p className="muted">{t.accountText}</p></div></header>
    <WidgetFrame id="session" title={t.session} icon="user">{loading ? <Skeleton label={t.sessionLoading}/> : session ? <div className="stack"><p className="account-email">{session.user.email}</p><Badge tone="green">{t.connectedMode}</Badge><Button onClick={() => void signOut()} disabled={busy}>{busy ? t.busy : t.signOut}</Button></div> : <div className="stack"><p>{t.noSession}</p><LinkButton href={`/${locale}/sign-in`} variant="primary">{t.signIn}<Icon name="arrow" size={17}/></LinkButton></div>}{error && <Notice tone="error">{t.authError}</Notice>}</WidgetFrame>
    <WidgetFrame id="privacy" title={t.privacyNotice} icon="lock"><p>{t.privacyNoticeText}</p><p className="muted">{t.localSaveHint}</p>{!hasApi && <Notice>{t.cloudUnavailable}</Notice>}</WidgetFrame>
    <WidgetFrame id="account-plans" title={t.pricing} icon="info"><p>{t.plansText}</p><LinkButton href={`/${locale}/pricing`}>{t.pricing}</LinkButton></WidgetFrame>
  </div>;
}
