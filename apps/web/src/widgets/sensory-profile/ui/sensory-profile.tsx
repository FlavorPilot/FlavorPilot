import type { SensoryProfile as Profile } from '@flavorpilot/contracts';
import { getDictionary, formatNumber, type Locale } from '@/shared/i18n';
import { WidgetFrame } from '@/shared/ui';
const dimensions = ['sweetness', 'acidity', 'saltiness', 'bitterness', 'umami', 'fat', 'pungency', 'freshness'] as const;
export function SensoryProfile({ profile, locale }: {
    profile: Profile;
    locale: Locale;
}) {
    const d = getDictionary(locale);
    return <WidgetFrame id="profile" title={d.messages.profile} subtitle={d.messages.profileHint} icon="sliders"><dl className="profile-bars">{dimensions.map(dimension => <div key={dimension}><dt>{d.dimensions[dimension]}</dt><dd><span className="profile-track"><i style={{ width: `${profile[dimension] * 10}%` }}/></span><strong>{formatNumber(profile[dimension], locale)}</strong><span className="sr-only"> / 10</span></dd></div>)}</dl></WidgetFrame>;
}
