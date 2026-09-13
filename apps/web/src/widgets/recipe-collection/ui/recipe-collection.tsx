import type { ReactNode } from 'react';
import type { Recipe } from '@/entities/dish';
import { ingredientById } from '@/entities/ingredient';
import { getDictionary, type Locale } from '@/shared/i18n';
import { Badge, Button, EmptyState, Icon } from '@/shared/ui';
export function RecipeCollection({ recipes, locale, onOpen, onDelete, onExport, emptyAction }: {
    recipes: Recipe[];
    locale: Locale;
    onOpen: (recipe: Recipe) => void;
    onDelete?: (recipe: Recipe) => void;
    onExport?: (recipe: Recipe) => void;
    emptyAction?: ReactNode;
}) {
    const t = getDictionary(locale).messages;
    if (!recipes.length)
        return <EmptyState title={t.emptyLibrary} text={t.emptyLibraryText} action={emptyAction} icon="book"/>;
    return <div className="recipe-grid">{recipes.map(recipe => <article className="recipe-card" key={`${recipe.origin}:${recipe.id}`}>
    <div className="recipe-card__motif" aria-hidden="true"><Icon name={recipe.origin === 'example' ? 'leaf' : 'flask'} size={35}/><span>{String(recipe.items.length).padStart(2, '0')}</span></div>
    <div className="recipe-card__body"><div className="recipe-card__badges"><Badge tone={recipe.origin === 'example' ? 'amber' : 'neutral'}>{recipe.origin === 'example' ? t.examples : recipe.origin === 'local' ? t.localDestination : t.cloudDestination}</Badge>{recipe.origin !== 'example' && <Badge><Icon name={recipe.origin === 'local' || recipe.visibility === 'private' ? 'lock' : recipe.visibility === 'public' ? 'globe' : 'link'} size={12}/>{recipe.origin === 'local' ? t.private : t[recipe.visibility]}</Badge>}</div>
      <h2>{recipe.name}</h2><p className="muted">{recipe.items.slice(0, 3).map(item => ingredientById.get(item.ingredientId)?.name[locale] ?? item.ingredientId).join(' · ')}{recipe.items.length > 3 ? ` +${recipe.items.length - 3}` : ''}</p>
      <p className="recipe-card__meta">{recipe.author || (recipe.origin === 'example' ? t.exampleOrigin : getDictionary(locale).goals[recipe.goal])}</p>
      <div className="recipe-card__actions"><Button onClick={() => onOpen(recipe)}>{t.open}<Icon name="arrow" size={16}/></Button><div>{onExport && <button type="button" className="icon-button" onClick={() => onExport(recipe)} aria-label={`${t.export}: ${recipe.name}`}><Icon name="download" size={17}/></button>}{onDelete && <button type="button" className="icon-button" onClick={() => onDelete(recipe)} aria-label={`${t.delete}: ${recipe.name}`}><Icon name="trash" size={17}/></button>}</div></div>
    </div>
  </article>)}</div>;
}
