import { notFound } from 'next/navigation';
import { HomeScreen } from '@/screens/home';
import { isLocale } from '@/shared/i18n';
export default async function Page({ params }: {
    params: Promise<{
        locale: string;
    }>;
}) {
    const { locale } = await params;
    if (!isLocale(locale))
        notFound();
    return <HomeScreen locale={locale}/>;
}
