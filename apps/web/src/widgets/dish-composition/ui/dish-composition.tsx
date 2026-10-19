'use client';
import { IngredientRow } from './ingredient-row';
import type { DishItem } from '@flavorpilot/contracts';

import { MAX_ITEMS } from '@/entities/dish';
import { IngredientSearch } from '@/features/ingredient-search';
import { getDictionary, formatNumber, type Locale } from '@/shared/i18n';
import { Badge, Button, EmptyState, Icon, WidgetFrame } from '@/shared/ui';
export function DishComposition({ items, totalWeight, locale, onAdd, onUpdate, onRemove, onExample }: {
    items: DishItem[];
    totalWeight: number;
    locale: Locale;
    onAdd: (id: string) => void;
    onUpdate: (index: number, patch: Partial<DishItem>) => void;
    onRemove: (index: number) => void;
    onExample: () => void;
}) {
    const t = getDictionary(locale).messages;
    return <WidgetFrame id="composition" title={t.composition} subtitle={t.compositionHint} icon="flask" className="composition-widget" action={<Badge>{items.length} / {MAX_ITEMS}</Badge>}>
    <IngredientSearch locale={locale} items={items} disabled={items.length >= MAX_ITEMS} onAdd={onAdd}/>
    {items.length ? <><div className="ingredient-columns" aria-hidden="true"><span>{t.ingredients}</span><span>{t.amount}</span><span>{t.preparation}</span></div><div className="ingredient-list">{items.map((item, index) => <IngredientRow key={`${item.ingredientId}::${item.preparationId}`} item={item} index={index} locale={locale} onChange={patch => onUpdate(index, patch)} onRemove={() => onRemove(index)}/>)}</div>
      <footer className="composition-total"><div><strong>{t.totalWeight}</strong><small>{t.totalWeightNote}</small></div><span>{formatNumber(totalWeight, locale)} <small>{t.grams}</small></span></footer></> : <EmptyState title={t.noIngredients} text={t.noIngredientsText} action={<Button onClick={onExample}><Icon name="spark" size={16}/>{t.tryExample}</Button>}/>}
  </WidgetFrame>;
}
