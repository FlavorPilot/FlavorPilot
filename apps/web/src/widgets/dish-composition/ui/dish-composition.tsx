'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { DishItem } from '@flavorpilot/contracts';
import { ingredientById, preparationById } from '@/entities/ingredient';
import { parseAmount, MAX_ITEMS } from '@/entities/dish';
import { IngredientSearch } from '@/features/ingredient-search';
import { getDictionary, formatNumber, type Locale } from '@/shared/i18n';
import { Badge, Button, EmptyState, Icon, WidgetFrame } from '@/shared/ui';
function IngredientRow({ item, index, locale, onChange, onRemove }: {
    item: DishItem;
    index: number;
    locale: Locale;
    onChange: (patch: Partial<DishItem>) => void;
    onRemove: () => void;
}) {
    const ingredient = ingredientById.get(item.ingredientId);
    const t = getDictionary(locale).messages;
    const [value, setValue] = useState(String(item.grams));
    const [invalid, setInvalid] = useState(false);
    const id = useId();
    const editing = useRef(false);
    useEffect(() => {
        if (!editing.current)
            setValue(String(item.grams));
        setInvalid(false);
    }, [item.grams]);
    if (!ingredient)
        return null;
    const commit = () => {
        const parsed = parseAmount(value);
        if (parsed === null) {
            setInvalid(true);
            return;
        }
        setInvalid(false);
        onChange({ grams: parsed });
    };
    return <div className="ingredient-row" data-testid="ingredient-row">
    <div className="ingredient-row__name"><span className="ingredient-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{ingredient.name[locale]}</strong><small>{ingredient.category[locale]}</small></div></div>
    <div className="ingredient-row__amount"><label className="sr-only" htmlFor={`${id}-grams`}>{ingredient.name[locale]} — {t.amount}</label><div className="number-field"><input id={`${id}-grams`} inputMode="decimal" value={value} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} onFocus={() => { editing.current = true; }} onChange={event => {
            const text = event.target.value;
            setValue(text);
            const parsed = parseAmount(text);
            if (parsed !== null) {
                setInvalid(false);
                onChange({ grams: parsed });
            }
        }} onBlur={() => { editing.current = false; commit(); }} onKeyDown={event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                commit();
            }
            if (event.key === 'Escape') {
                setValue(String(item.grams));
                setInvalid(false);
            }
        }}/><span>{t.grams}</span></div></div>
    <label className="ingredient-row__prep"><span className="sr-only">{ingredient.name[locale]} — {t.preparation}</span><select value={item.preparationId} onChange={event => onChange({ preparationId: event.target.value })}>{ingredient.preparations.map(prep => <option key={prep} value={prep}>{preparationById.get(prep)?.name[locale] ?? prep}</option>)}</select></label>
    <button type="button" className="icon-button ingredient-row__remove" aria-label={`${t.remove} ${ingredient.name[locale]}`} onClick={onRemove}><Icon name="close" size={17}/></button>
    {invalid && <p id={`${id}-error`} role="alert" className="field-error ingredient-row__error">{t.invalidAmount}</p>}
  </div>;
}
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
