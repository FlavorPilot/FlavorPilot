import type { DishAnalysis, DishItem } from '@flavorpilot/contracts';
import { ingredientById, preparationById } from '@/entities/ingredient';
import { getDictionary, formatNumber, type Locale } from '@/shared/i18n';
import { Button, Icon, Notice } from '@/shared/ui';
export function ChangePreview({ item, before, after, locale, onApply, onCancel }: {
    item: DishItem;
    before: DishAnalysis;
    after: DishAnalysis;
    locale: Locale;
    onApply: () => void;
    onCancel: () => void;
}) {
    const t = getDictionary(locale).messages;
    const delta = after.balanceScore - before.balanceScore;
    return <section className="change-preview" aria-label={t.previewTitle} role="region" data-testid="change-preview"><div><BadgeLabel text={t.previewTitle}/><h2>+ {ingredientById.get(item.ingredientId)?.name[locale]} <span>{formatNumber(item.grams, locale)} {t.grams}</span></h2><p className="muted small">{t.previewNote}</p><p className="small">{t.preparationPreview}: {preparationById.get(item.preparationId)?.name[locale]}</p></div>
    <div className="preview-score"><span>{t.balance}</span><strong>{before.balanceScore}<Icon name="arrow" size={19}/>{after.balanceScore}</strong><small>{t.balanceChange}: {delta > 0 ? '+' : ''}{delta}</small></div>
    <div className="preview-actions"><Button variant="primary" onClick={onApply}>{t.applyChange}<Icon name="check" size={17}/></Button><Button variant="ghost" onClick={onCancel}>{t.discardPreview}</Button></div>
    <div className="preview-note"><Notice>{t.samePreparation} {t.modelEstimate}</Notice></div>
  </section>;
}
function BadgeLabel({ text }: {
    text: string;
}) { return <p className="eyebrow">{text}</p>; }
