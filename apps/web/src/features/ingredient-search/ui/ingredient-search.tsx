'use client';
import { useId, useMemo, useRef, useState } from 'react';
import { ingredients, firstPreparation } from '@/entities/ingredient';
import type { DishItem } from '@flavorpilot/contracts';
import { getDictionary, type Locale } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
export function IngredientSearch({ locale, items, disabled, onAdd }: {
    locale: Locale;
    items: DishItem[];
    disabled: boolean;
    onAdd: (id: string) => void;
}) {
    const t = getDictionary(locale).messages;
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const id = useId();
    const root = useRef<HTMLDivElement>(null);
    const results = useMemo(() => ingredients.filter(ingredient => {
        const hasDefault = items.some(item => item.ingredientId === ingredient.id && item.preparationId === firstPreparation(ingredient.id));
        const text = `${ingredient.name.en} ${ingredient.name.uk} ${ingredient.category[locale]}`.toLocaleLowerCase();
        return !hasDefault && text.includes(query.trim().toLocaleLowerCase());
    }).slice(0, 8), [items, query, locale]);
    function select(index: number) {
        const ingredient = results[index];
        if (!ingredient)
            return;
        onAdd(ingredient.id);
        setQuery('');
        setOpen(false);
        setActive(0);
    }
    return <div className="ingredient-search" ref={root} onBlur={event => {
            if (!root.current?.contains(event.relatedTarget as Node))
                setOpen(false);
        }}>
    <label htmlFor={`${id}-input`} className="field-label">{t.addIngredient}</label>
    <div className="search-field"><Icon name="search" size={19}/><input id={`${id}-input`} type="search" autoComplete="off" disabled={disabled} role="combobox" aria-expanded={open} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={open && results[active] ? `${id}-${active}` : undefined} placeholder={t.searchIngredients} value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setActive(0); setOpen(true); }} onKeyDown={event => {
            if (event.key === 'Escape') {
                setOpen(false);
                return;
            }
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setOpen(true);
                setActive(n => Math.min(results.length - 1, n + 1));
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActive(n => Math.max(0, n - 1));
            }
            if (event.key === 'Enter' && open) {
                event.preventDefault();
                select(active);
            }
        }}/></div>
    {open && <ul id={`${id}-list`} role="listbox" className="search-results" aria-label={t.ingredients}>
      {results.map((ingredient, index) => <li key={ingredient.id} id={`${id}-${index}`} role="option" aria-selected={index === active} onMouseDown={event => event.preventDefault()} onClick={() => select(index)} onMouseEnter={() => setActive(index)}>
        <div><strong>{ingredient.name[locale]}</strong><span>{ingredient.category[locale]}</span></div><Icon name="plus" size={18}/>
      </li>)}
      {!results.length && <li className="search-empty" role="presentation">{t.noMatches}<small>{t.noMatchesHint}</small></li>}
    </ul>}
  </div>;
}
