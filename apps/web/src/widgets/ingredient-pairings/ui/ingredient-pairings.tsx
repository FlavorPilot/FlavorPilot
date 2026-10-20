import type { PairResult } from '@flavorpilot/contracts';
import { ingredientById } from '@/entities/ingredient';
import { getDictionary, type Locale } from '@/shared/i18n';
import { EmptyState, WidgetFrame } from '@/shared/ui';
export function IngredientPairings({ pairs, locale }: {
    pairs: PairResult[];
    locale: Locale;
}) {
    const d=getDictionary(locale),t = d.messages;
    return <WidgetFrame id="pairings" title={t.pairings} subtitle={t.pairingsHint} icon="link">{!pairs.length ? <EmptyState title={t.notEnough}/> : <div className="table-scroll" tabIndex={0} aria-label={t.pairings}><table className="pair-table"><caption className="sr-only">{t.pairings}</caption><thead><tr><th>{t.ingredientA}</th><th>{t.ingredientB}</th><th>{t.pairScore}</th><th>{t.pairBasis}</th></tr></thead><tbody>{[...pairs].sort((a, b) => a.score===null?(b.score===null?0:1):b.score===null?-1:a.score-b.score).map((pair, index) => <tr key={`${pair.ingredientAId}-${pair.ingredientBId}-${index}`}><td>{ingredientById.get(pair.ingredientAId)?.name[locale]}</td><td>{ingredientById.get(pair.ingredientBId)?.name[locale]}</td><td>{pair.score===null?t.unknown:<><strong>{pair.score}</strong><span className="muted"> / 100</span></>}</td><td>{d.pairSignals[pair.signal??'unknown']}</td></tr>)}</tbody></table></div>}</WidgetFrame>;
}
