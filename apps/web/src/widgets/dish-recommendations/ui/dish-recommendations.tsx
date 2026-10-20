import type { IngredientRecommendation } from '@flavorpilot/contracts';
import { ingredientById, preparationById } from '@/entities/ingredient';
import { getDictionary, formatNumber, type Locale } from '@/shared/i18n';
import { Badge, Button, EmptyState, Icon, WidgetFrame } from '@/shared/ui';
export function DishRecommendations({ recommendations, locale, onPreview, disabled = false }: {
    recommendations: IngredientRecommendation[];
    locale: Locale;
    onPreview: (value: IngredientRecommendation) => void;
    disabled?: boolean;
}) {
    const d = getDictionary(locale);
    const t = d.messages;
    return <WidgetFrame id="suggestions" title={t.recommendations} subtitle={t.recommendationsHint} icon="spark" className="recommendations-widget">
    {!recommendations.length ? <EmptyState title={t.noRecommendations} icon="spark"/> : <div className="recommendation-grid">{recommendations.slice(0, 6).map((recommendation, index) => <article className="recommendation-card" key={recommendation.ingredientId}>
      <header><span className="recommendation-number">{String(index + 1).padStart(2, '0')}</span><Badge>{formatNumber(recommendation.recommendedGrams, locale)} {t.grams}</Badge></header>
      <h3>{ingredientById.get(recommendation.ingredientId)?.name[locale]}</h3>
      <p>{recommendation.reasons.slice(0, 2).map(reason => d.reasons[reason]).join(' · ') || t.modelEstimate}</p>
      <p>{t.goalFitChange}: +{formatNumber(recommendation.balanceDelta, locale)}</p><p className="small muted">{t.goalTrialNote}</p>
      <details className="recommendation-details"><summary>{t.reason}</summary>
        <p>{t.recommendationTrialNote}</p>
        <dl>
          <div><dt>{t.preparationPreview}</dt><dd>{preparationById.get(recommendation.preparationId)?.name[locale]}</dd></div>
          <div><dt>{t.balanceChange}</dt><dd>{recommendation.balanceDelta > 0 ? '+' : ''}{formatNumber(recommendation.balanceDelta, locale)}</dd></div>
          <div><dt>{recommendation.pairCoverage?t.assessedCompatibility:t.compatibility}</dt><dd>{recommendation.compatibility===null?t.unknown:`${recommendation.compatibility}/100`}{recommendation.pairCoverage&&<small> · {recommendation.pairCoverage.assessedPairs}/{recommendation.pairCoverage.totalPairs} {t.pairsAssessed}</small>}</dd></div>

          {recommendation.profileChanges.map(change => <div key={change.dimension}><dt>{d.dimensions[change.dimension]}</dt><dd>{formatNumber(change.before, locale, 2)} → {formatNumber(change.after, locale, 2)}</dd></div>)}
        </dl>
      </details>
      <Button onClick={() => onPreview(recommendation)} disabled={disabled}>{t.preview}<Icon name="arrow" size={16}/></Button>
    </article>)}</div>}
  </WidgetFrame>;
}
