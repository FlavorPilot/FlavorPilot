import { notFound } from 'next/navigation';
import { RecipeScreen } from '@/screens/recipe';
import { isLocale } from '@/shared/i18n';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: {
    params: Promise<{
        locale: string;
        id: string;
    }>;
}) {
    const { locale, id } = await params;
    if (!isLocale(locale))
        notFound();
    return <RecipeScreen locale={locale} id={id} shared={false}/>;
}
