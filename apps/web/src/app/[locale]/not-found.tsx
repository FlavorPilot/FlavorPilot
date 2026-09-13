'use client';
import { useParams } from 'next/navigation';
import { getDictionary, isLocale } from '@/shared/i18n';
import { EmptyState, LinkButton } from '@/shared/ui';
export default function NotFound() { const params = useParams(); const locale = typeof params.locale === 'string' && isLocale(params.locale) ? params.locale : 'en'; const t = getDictionary(locale).messages; return <EmptyState title={t.notFound} text={t.notFoundText} action={<LinkButton href={`/${locale}/builder`}>{t.openStudio}</LinkButton>}/>; }
