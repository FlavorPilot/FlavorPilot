import { notFound } from 'next/navigation';
import { AdminScreen } from '@/screens/admin';
import { isLocale } from '@/shared/i18n';
export const metadata={robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{locale:string}>}) {
    const {locale}=await params;if(!isLocale(locale))notFound();return <AdminScreen locale={locale}/>;
}
