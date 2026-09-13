'use client';
import { useAuthForm } from '@/features/authentication';
import Link from 'next/link';
import { useSession } from '@/features/session';
import { getDictionary, type Locale } from '@/shared/i18n';
import { Button, Icon, LinkButton, Notice, WidgetFrame } from '@/shared/ui';
export function AuthPanel({ locale, mode }: {
    locale: Locale;
    mode: 'sign-in' | 'sign-up' | 'reset-password';
}) {
    const t = getDictionary(locale).messages;
    const { client, session } = useSession();
    const { email, setEmail, password, setPassword, busy, error, notice, submit } = useAuthForm({ client, session, locale, mode });
    const title = mode === 'sign-up' ? t.signUp : mode === 'reset-password' ? t.forgotPassword : t.signIn;
    return <WidgetFrame id="authentication" title={title} icon="user">
    {!client ? <div className="stack"><Notice>{t.authUnavailable}</Notice><LinkButton href={`/${locale}/builder`} variant="primary">{t.continueLocal}<Icon name="arrow" size={16}/></LinkButton></div> : <form className="stack" onSubmit={submit}>
      {!(mode === 'reset-password' && session) && <label className="field-label">{t.email}<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required disabled={busy}/></label>}
      {(mode !== 'reset-password' || session) && <label className="field-label">{mode === 'reset-password' ? t.newPassword : t.password}<input type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={8} disabled={busy}/><small className="muted">{t.passwordHint}</small></label>}
      {error && <Notice role="alert" tone="error">{t.authError}</Notice>}{notice && <Notice tone="success">{notice}</Notice>}
      <Button variant="primary" type="submit" disabled={busy}>{busy ? t.busy : mode === 'reset-password' && session ? t.updatePassword : title}<Icon name="arrow" size={16}/></Button>
      {session && <Link href={`/${locale}/builder`}>{t.openStudio}</Link>}
    </form>}
    <div className="auth-switch"><Link href={`/${locale}/${mode === 'sign-in' ? 'sign-up' : 'sign-in'}`}>{mode === 'sign-in' ? t.signUp : t.signIn}</Link>{mode !== 'reset-password' && <Link href={`/${locale}/reset-password`}>{t.forgotPassword}</Link>}</div>
  </WidgetFrame>;
}
