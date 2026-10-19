import type { DishItem } from '@flavorpilot/contracts';
import {formatItemAmount} from '@/entities/dish';
import { ingredientById, preparationById } from '@/entities/ingredient';
import { formatNumber, getDictionary, type Locale } from '@/shared/i18n';
import { WidgetFrame } from '@/shared/ui';

export function RecipeContext({ items, locale }: { items: DishItem[]; locale: Locale }) {
    const t = getDictionary(locale).messages;
    return <WidgetFrame id="recipe-context" title={t.recipeContextTitle} subtitle={t.recipeContextHint} icon="flask">
        {items.length ? <div className="read-only-items">{items.map(item => <div key={`${item.ingredientId}:${item.preparationId}`}>
            <span>{ingredientById.get(item.ingredientId)?.name[locale] ?? item.ingredientId}<small>{preparationById.get(item.preparationId)?.name[locale] ?? item.preparationId}</small></span>
            <strong>{formatItemAmount(item,locale)}</strong>
        </div>)}</div> : <p className="muted">{t.recipeContextEmpty}</p>}
    </WidgetFrame>;
}
