import { notFound } from 'next/navigation';
import { AuthCallbackScreen } from '@/screens/auth';
import { isLocale } from '@/shared/i18n';
export default async function Page({ params }: {
    params: Promise<{
        locale: string;
    }>;
}) {
    const { locale } = await params;
    if (!isLocale(locale))
        notFound();
    return <AuthCallbackScreen locale={locale}/>;
}
