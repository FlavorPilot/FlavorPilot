'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/features/session';
import { getDictionary, type Locale } from '@/shared/i18n';
import { LinkButton, Notice, Skeleton } from '@/shared/ui';
export function AuthCallbackScreen({ locale }: {
    locale: Locale;
}) {
    const t = getDictionary(locale).messages;
    const { client } = useSession();
    const router = useRouter();
    const attempt = useRef<Promise<void> | null>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        if (!client) {
            setFailed(true);
            return;
        }
        let live = true;
        if (!attempt.current)
            attempt.current = (async () => {
                const query = new URLSearchParams(window.location.search);
                const code = query.get('code');
                if (!code)
                    throw new Error('NO_CODE');
                const { error } = await client.auth.exchangeCodeForSession(code);
                if (error)
                    throw error;
            })();
        attempt.current.then(() => {
            if (live) {
                const recovery = new URLSearchParams(window.location.search).get('mode') === 'recovery';
                router.replace(`/${locale}/${recovery ? 'reset-password' : 'builder'}`);
            }
        }).catch(() => {
            if (live)
                setFailed(true);
        });
        return () => { live = false; };
    }, [client, locale, router]);
    return failed ? <Notice tone="error"><p>{t.callbackError}</p><LinkButton href={`/${locale}/sign-in`}>{t.signIn}</LinkButton></Notice> : <Skeleton label={t.callbackLoading}/>;
}
