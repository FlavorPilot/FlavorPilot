'use client';
import { useParams } from 'next/navigation';
import { getDictionary, isLocale } from '@/shared/i18n';
import { Button, Notice } from '@/shared/ui';
export default function ErrorPage({ reset }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}) {
    const params = useParams();
    const locale = typeof params.locale === 'string' && isLocale(params.locale) ? params.locale : 'en';
    const t = getDictionary(locale).messages;
    return <Notice role="alert" tone="error"><h1>{t.uiError}</h1><p>{t.uiErrorText}</p><Button onClick={reset}>{t.retry}</Button></Notice>;
}
