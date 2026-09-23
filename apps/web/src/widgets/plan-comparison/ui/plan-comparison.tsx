import { getDictionary, type Locale } from '@/shared/i18n';
import { Badge, Button, Icon, LinkButton } from '@/shared/ui';
export function PlanComparison({ locale }: {
    locale: Locale;
}) {
    const t = getDictionary(locale).messages;
    return <div className="plans-grid"><section className="plan-card"><Badge tone="green">{t.available}</Badge><h2>{t.free}</h2><p>{t.freeDesc}</p><strong className="plan-price">€0</strong><ul>{[t.freeFeature1, t.freeFeature2, t.freeFeature3].map(feature => <li key={feature}><Icon name="check" size={18}/>{feature}</li>)}</ul><LinkButton href={`/${locale}/builder`} variant="primary">{t.openStudio}<Icon name="arrow" size={16}/></LinkButton></section>
    <section className="plan-card plan-card--future"><Badge>{t.planned}</Badge><h2>{t.pro}</h2><p>{t.proDesc}</p><div className="plan-price">—</div><ul>{[t.proFeature1, t.proFeature2, t.proFeature3, t.proFeature4].map(feature => <li key={feature}><Icon name="lock" size={18}/>{feature}</li>)}</ul><Button disabled>{t.planned}</Button></section>
  </div>;
}
