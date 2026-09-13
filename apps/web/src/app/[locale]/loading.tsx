'use client';
import { useParams } from 'next/navigation';
import { getDictionary, isLocale } from '@/shared/i18n';
import { Skeleton } from '@/shared/ui';
export default function Loading() { const params = useParams(); const locale = typeof params.locale === 'string' && isLocale(params.locale) ? params.locale : 'en'; return <Skeleton label={getDictionary(locale).messages.loading}/>; }
