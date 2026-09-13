import { getDictionary, type Locale } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { AuthPanel } from '@/widgets/auth-panel';
export function AuthScreen({ locale, mode }: {
    locale: Locale;
    mode: 'sign-in' | 'sign-up' | 'reset-password';
}) {
    const t = getDictionary(locale).messages;
    return <div className="auth-layout"><div className="auth-intro"><span className="auth-intro__mark"><Icon name="leaf" size={44}/></span><p className="eyebrow">FlavorPilot</p><h1>{t.authTitle}</h1><p>{t.authText}</p></div><AuthPanel locale={locale} mode={mode}/></div>;
}
