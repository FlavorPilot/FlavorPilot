import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SessionProvider } from '@/features/session';
import { AppShell } from '@/widgets/app-shell';
import { getDictionary, isLocale } from '@/shared/i18n';
import '@/shared/styles/global.css';
export function generateStaticParams() { return [{ locale: 'en' }, { locale: 'uk' }]; }
export async function generateMetadata({ params }: {
    params: Promise<{
        locale: string;
    }>;
}): Promise<Metadata> {
    const { locale } = await params;
    if (!isLocale(locale))
        return {};
    const t = getDictionary(locale).messages;
    return { title: { default: 'FlavorPilot', template: '%s · FlavorPilot' }, description: t.heroText, robots: { index: false, follow: false } };
}
export default async function LocaleLayout({ children, params }: {
    children: React.ReactNode;
    params: Promise<{
        locale: string;
    }>;
}) {
    const { locale } = await params;
    if (!isLocale(locale))
        notFound();
    return <html lang={locale}><body><SessionProvider><AppShell locale={locale}>{children}</AppShell></SessionProvider></body></html>;
}
