'use client';
import { useState, type FormEvent } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { getDictionary, type Locale } from '@/shared/i18n';
export type AuthFormMode = 'sign-in' | 'sign-up' | 'reset-password';
export function useAuthForm({ client, session, locale, mode }: {
    client: SupabaseClient | null;
    session: Session | null;
    locale: Locale;
    mode: AuthFormMode;
}) {
    const t = getDictionary(locale).messages;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const [notice, setNotice] = useState('');
    async function submit(event: FormEvent) {
        event.preventDefault();
        if (!client || busy)
            return;
        setBusy(true);
        setError(false);
        setNotice('');
        try {
            if (mode === 'sign-up') {
                const result = await client.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/${locale}/auth/callback` } });
                if (result.error)
                    throw result.error;
                setNotice(result.data.session ? t.authSuccess : t.verifyEmail);
            }
            else if (mode === 'reset-password' && session) {
                const result = await client.auth.updateUser({ password });
                if (result.error)
                    throw result.error;
                setNotice(t.passwordUpdated);
                setPassword('');
            }
            else if (mode === 'reset-password') {
                const result = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/${locale}/auth/callback?mode=recovery` });
                if (result.error)
                    throw result.error;
                setNotice(t.resetEmailSent);
            }
            else {
                const result = await client.auth.signInWithPassword({ email, password });
                if (result.error)
                    throw result.error;
                setNotice(t.authSuccess);
                setPassword('');
            }
        }
        catch {
            setError(true);
        }
        finally {
            setBusy(false);
        }
    }
    return { email, setEmail, password, setPassword, busy, error, notice, submit };
}
