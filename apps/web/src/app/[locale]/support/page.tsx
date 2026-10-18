import { notFound } from 'next/navigation';
import { SupportScreen } from '@/screens/support';
import { isLocale } from '@/shared/i18n';
export const metadata={robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{locale:string}>}) {
    const {locale}=await params;if(!isLocale(locale))notFound();return <SupportScreen locale={locale}/>;
}
