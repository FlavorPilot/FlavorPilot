import type { CSSProperties } from 'react';
import type { CompositionAmount, DishAnalysis as Analysis } from '@flavorpilot/contracts';
import { ingredientById } from '@/entities/ingredient';
import { getDictionary, formatNumber, type Locale } from '@/shared/i18n';
import { Badge, EmptyState, Icon, WidgetFrame } from '@/shared/ui';
const nutrientLabel = { protein: 'compositionProtein', fat: 'compositionFat', carbohydrate: 'compositionCarbohydrate', sugars: 'compositionSugars', sodium: 'compositionSodium', energy: 'compositionEnergy' } as const;
const unitLabel = { g: 'unitG', mg: 'unitMg', kcal: 'unitKcal' } as const;
function CompositionReference({ nutrients, locale }: { nutrients: CompositionAmount[]; locale: Locale }) {
    const t = getDictionary(locale).messages;
    return <section className="composition-reference" aria-labelledby="published-composition">
      <h3 id="published-composition">{t.publishedComposition}</h3>
      <p className="muted small">{t.compositionNote}</p>
      <dl className="composition-list">{nutrients.map(item => <div key={item.nutrient}><dt>{t[nutrientLabel[item.nutrient]]}</dt><dd>{item.amount === null ? t.compositionMissing : <>{formatNumber(item.amount, locale, item.unit === 'g' ? 1 : 0)} {t[unitLabel[item.unit]]}</>}<small>{item.coveredItems} {t.compositionOf} {item.totalItems}</small></dd></div>)}</dl>
    </section>;
}
export function DishAnalysis({ analysis, locale, itemCount }: {
    analysis: Analysis;
    locale: Locale;
    itemCount: number;
}) {
    const d = getDictionary(locale);
    const t = d.messages;
    const issue = analysis.issues.find(item => item.severity === 'critical') ?? analysis.issues.find(item => item.severity === 'warning') ?? analysis.issues.find(item => item.code !== 'emptyDish' && item.code !== 'singleIngredient');
    return <WidgetFrame id="assessment" title={t.analysis} subtitle={t.analysisHint} icon="compass" className="analysis-widget">
    {itemCount < 2 ? <EmptyState title={t.notEnough} icon="compass"/> : <>
      <div className="assessment-hero"><div className="score-ring" style={{ '--score': `${Math.max(0, Math.min(100, analysis.overallScore))}%` } as CSSProperties} role="img" aria-label={`${t.overall}: ${analysis.overallScore} ${t.outOf}`}><div><strong>{analysis.overallScore}</strong><span>/ 100</span></div></div>
        <div><Badge tone="green">{t.knowledge}</Badge><h3>{t.overall}</h3><p className="muted small">{t.modelEstimate}</p></div>
      </div>
      <dl className="metric-grid">{([['compatibility', analysis.compatibilityScore], ['balance', analysis.balanceScore], ['quantity', analysis.quantityScore], ['texture', analysis.textureScore]] as const).map(([key, value]) => <div key={key}><dt>{t[key]}</dt><dd>{value}<span>/100</span></dd></div>)}</dl>
      <div className={`primary-issue ${issue ? 'primary-issue--warning' : ''}`}><Icon name={issue ? 'warning' : 'check'} size={18}/><div><strong>{issue ? t.attention : t.noIssues}</strong><p>{issue ? d.issues[issue.code] : t.noIssuesNote}</p>{issue?.ingredientId && <small>{ingredientById.get(issue.ingredientId)?.name[locale]}</small>}</div></div>
      <details className="disclosure"><summary>{t.details}</summary><p>{t.scoreExplanation}</p><p><strong>{t.confidence}: {formatNumber(analysis.confidence, locale, 0)}</strong> / 100. {t.confidenceNote}</p><p>{t.knowledgeNote}</p></details>
    </>}
    {analysis.composition.totalItems > 0 && <CompositionReference nutrients={analysis.composition.nutrients} locale={locale}/>}
  </WidgetFrame>;
}
