'use client';
import { useAdminAccess } from '../model/use-admin';
import { getDictionary,type Locale } from '@/shared/i18n';
import { LinkButton } from '@/shared/ui';
export function AdminEntry({token,locale}:{token:string;locale:Locale}) {
    const {access}=useAdminAccess(token);
    return access ? <LinkButton href={`/${locale}/admin`}>{getDictionary(locale).messages.crmTitle}</LinkButton> : null;
}
