import type { CSSProperties, ReactNode } from 'react';
import type { CompositionAmount, DishAnalysis as Analysis } from '@flavorpilot/contracts';
import { ingredientById, preparationById } from '@/entities/ingredient';
import { getDictionary, formatNumber, type Locale } from '@/shared/i18n';
import { Badge, EmptyState, HoverNote, Icon, WidgetFrame } from '@/shared/ui';
const nutrientLabel = { protein: 'compositionProtein', fat: 'compositionFat', carbohydrate: 'compositionCarbohydrate', sugars: 'compositionSugars', sodium: 'compositionSodium', energy: 'compositionEnergy' } as const;
const unitLabel = { g: 'unitG', mg: 'unitMg', kcal: 'unitKcal' } as const;
function CompositionReference({ nutrients, locale }: { nutrients: CompositionAmount[]; locale: Locale }) {
    const t = getDictionary(locale).messages;
    return <section className="composition-reference" aria-labelledby="published-composition">
      <div className="composition-heading"><h3 id="published-composition">{t.publishedComposition}</h3><HoverNote label={t.compositionAbout} trigger={<Icon name="info" size={17}/>} closeLabel={t.close}><p>{t.compositionNote}</p></HoverNote></div>
      <dl className="composition-list">{nutrients.map(item => <div key={item.nutrient}><dt>{t[nutrientLabel[item.nutrient]]}</dt><dd>{item.amount === null ? t.compositionMissing : <>{formatNumber(item.amount, locale, item.unit === 'g' ? 1 : 0)} {t[unitLabel[item.unit]]}</>}
        <HoverNote label={`${t[nutrientLabel[item.nutrient]]}: ${t.compositionCoverage}`} closeLabel={t.close} trigger={<span className="composition-coverage">{item.coveredItems} {t.compositionOf} {item.totalItems}</span>}>
          <strong>{t[nutrientLabel[item.nutrient]]}</strong><p>{t.compositionContributions}</p>
          <ul className="composition-contributions">{item.contributions.map((contribution, index) => <li key={`${contribution.ingredientId}-${contribution.preparationId}-${index}`}>
            <div className="composition-contribution-title"><strong>{ingredientById.get(contribution.ingredientId)?.name[locale] ?? contribution.ingredientId}</strong><span>{contribution.amount === null ? t.compositionMissing : `${formatNumber(contribution.amount, locale, 2)} ${t[unitLabel[item.unit]]}`}</span></div>
            <small>{formatNumber(contribution.grams, locale)} {t.unitG} · {preparationById.get(contribution.preparationId)?.name[locale]}</small>
            {contribution.per100g === null ? <small>{t.compositionExcluded}</small> : <small>{formatNumber(contribution.per100g, locale, 3)} {t[unitLabel[item.unit]]} / 100 {t.unitG}</small>}
            {contribution.fdcId !== null && <a href={`https://fdc.nal.usda.gov/food-details/${contribution.fdcId}/nutrients`} target="_blank" rel="noreferrer">{t.compositionSource} {contribution.fdcId}<span className="composition-source-description">{contribution.sourceDescription}</span></a>}
          </li>)}</ul>
        </HoverNote>
      </dd></div>)}</dl>
    </section>;
}
export function DishAnalysis({ analysis, locale, itemCount, feedback }: {
    analysis: Analysis;
    locale: Locale;
    itemCount: number;
    feedback?: ReactNode;
}) {
    const d = getDictionary(locale);
    const t = d.messages;
    const coverage=analysis.ingredientAssessment;
    const conflicts=analysis.pairResults.filter(pair=>pair.signal==='potentialConflict');
    const issue = analysis.issues.find(item => item.severity === 'critical') ?? analysis.issues.find(item => item.severity === 'warning') ?? analysis.issues.find(item => item.code !== 'emptyDish' && item.code !== 'singleIngredient');
    return <WidgetFrame id="assessment" title={t.analysis} subtitle={t.analysisHint} icon="compass" className="analysis-widget">
    {itemCount < 2 ? <EmptyState title={t.notEnough} icon="compass"/> : <>
      <div className="assessment-hero">{analysis.overallScore!==null&&<div className="score-ring" style={{ '--score': `${Math.max(0, Math.min(100, analysis.overallScore))}%` } as CSSProperties} role="img" aria-label={`${t.overall}: ${analysis.overallScore} ${t.outOf}`}><div><strong>{analysis.overallScore}</strong><span>/ 100</span></div></div>}
        <div><Badge tone="green">{t.knowledge}</Badge><h3>{t.overall}</h3>{analysis.overallScore===null&&<p role="status">{t.unknown}</p>}<p className="muted small">{t.modelEstimate}</p></div>
      </div>
      <dl className="metric-grid">{([['compatibility', analysis.compatibilityScore], ['balance', analysis.balanceScore], ['quantity', analysis.quantityScore], ['texture', analysis.textureScore]] as const).map(([key, value]) => <div key={key}><dt>{t[key]}</dt><dd>{value===null?t.unknown:value}{value!==null&&<span>/100</span>}</dd></div>)}</dl>
      <p className="small muted">{t.textureModelNote}</p>
      {conflicts.length>0&&<section className="primary-issue primary-issue--warning"><Icon name="warning" size={18}/><div><strong>{t.potentialConflicts}</strong><ul>{conflicts.map((pair,index)=><li key={index}>{ingredientById.get(pair.ingredientAId)?.name[locale]} + {ingredientById.get(pair.ingredientBId)?.name[locale]}</li>)}</ul><p>{t.hypothesisOnly}</p></div></section>}
      <div className={`primary-issue ${issue ? 'primary-issue--warning' : 'primary-issue--neutral'}`}><Icon name={issue ? 'warning' : 'info'} size={18}/><div><strong>{issue ? t.attention : t.noIssues}</strong><p>{issue ? d.issues[issue.code] : t.noIssuesNote}</p>{issue?.ingredientId && <small>{ingredientById.get(issue.ingredientId)?.name[locale]}</small>}</div></div>
      {coverage&&<details className="disclosure ingredient-shares"><summary>{t.ingredientShares}</summary><p>{t.ingredientSharesNote}</p><dl>{coverage.shares.map((share,index)=><div key={index}><dt>{ingredientById.get(share.ingredientId)?.name[locale]}<small> · {preparationById.get(share.preparationId)?.name[locale]}</small>{share.catalogueRangeExceeded&&<p className="small muted">{d.issues.outsideRecommendedRange}</p>}</dt><dd>{formatNumber(share.percent,locale,2)}% · {formatNumber(share.grams,locale,3)} {t.grams}</dd></div>)}</dl></details>}
      <details className="disclosure"><summary>{t.details}</summary><p>{t.scoreExplanation}</p><p>{t.knowledgeNote}</p></details>
    </>}
    {itemCount >= 2 && feedback}
    {analysis.composition.totalItems > 0 && <CompositionReference nutrients={analysis.composition.nutrients} locale={locale}/>}
  </WidgetFrame>;
}
