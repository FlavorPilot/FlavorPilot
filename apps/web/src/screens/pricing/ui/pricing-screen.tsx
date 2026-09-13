import { getDictionary, type Locale } from '@/shared/i18n';
import { Notice } from '@/shared/ui';
import { PlanComparison } from '@/widgets/plan-comparison';
export function PricingScreen({ locale }: {
    locale: Locale;
}) { const t = getDictionary(locale).messages; return <div className="stack page-stack narrow"><header className="page-heading"><div><p className="eyebrow">{t.pricing}</p><h1>{t.plansTitle}</h1><p className="muted">{t.plansText}</p></div></header><PlanComparison locale={locale}/><Notice>{t.noCheckout}</Notice></div>; }
