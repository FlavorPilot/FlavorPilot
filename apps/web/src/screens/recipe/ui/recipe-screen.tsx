'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeDish } from '@flavorpilot/flavor-engine';
import { dishRepository, openRecipeDraft, type Recipe } from '@/entities/dish';
import { ingredientById, preparationById, publicDishSeeds } from '@/entities/ingredient';
import { useSession } from '@/features/session';
import { getDictionary, formatNumber, type Locale } from '@/shared/i18n';
import { Badge, Button, EmptyState, Icon, LinkButton, Notice, Skeleton, WidgetFrame } from '@/shared/ui';
import { DishAnalysis } from '@/widgets/dish-analysis';
import { SensoryProfile } from '@/widgets/sensory-profile';
import { IngredientPairings } from '@/widgets/ingredient-pairings';
export function RecipeScreen({ locale, id, shared = false }: {
    locale: Locale;
    id: string;
    shared?: boolean;
}) {
    const t = getDictionary(locale).messages;
    const { session } = useSession();
    const router = useRouter();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        setBusy(true);
        setError('');
        setRecipe(null);
        async function load() {
            try {
                const seed = !shared ? publicDishSeeds.find(item => item.id === id) : undefined;
                const result: Recipe = seed ? { id: seed.id, name: seed.name[locale], items: seed.items, goal: seed.goal, origin: 'example', visibility: 'public', createdAt: '1970-01-01T00:00:00.000Z' } : shared ? await dishRepository.shared(id) : await dishRepository.publicOne(id);
                if (active)
                    setRecipe(result);
            }
            catch {
                if (active)
                    setError(t.notFoundText);
            }
            finally {
                if (active)
                    setBusy(false);
            }
        }
        void load();
        return () => { active = false; };
    }, [id, shared, locale, t.notFoundText]);
    const analysis = useMemo(() => recipe ? analyzeDish(recipe.items, recipe.goal, false) : null, [recipe]);
    function remix() {
        if (!recipe)
            return;
        try {
            openRecipeDraft(recipe, 'remix', session?.user.id ?? 'guest');
            router.push(`/${locale}/builder`);
        }
        catch {
            setError(t.storageError);
        }
    }
    if (busy)
        return <Skeleton label={t.loading}/>;
    if (!recipe || !analysis)
        return <EmptyState title={t.notFound} text={error} action={<LinkButton href={`/${locale}/discover`}>{t.back}</LinkButton>}/>;
    return <div className="stack page-stack"><header className="page-heading"><div><p className="eyebrow">{recipe.origin === 'example' ? t.examples : t.recipe}</p><h1>{recipe.name}</h1><p className="muted">{recipe.author || (recipe.origin === 'example' ? t.exampleOrigin : t.community)}</p></div>{!shared && <Button variant="primary" onClick={remix}><Icon name="flask" size={17}/>{t.remix}</Button>}</header>
    {recipe.origin === 'example' && <Notice>{t.exampleNotice}</Notice>}{shared && <Notice><Badge>{t.unlisted}</Badge><p>{t.unlistedHint}</p></Notice>}{error && <Notice tone="error">{error}</Notice>}
    {!shared && <p className="small muted">{t.remixNotice}</p>}
    <div className="studio-grid"><WidgetFrame id="recipe-composition" title={t.composition} icon="flask"><div className="read-only-items">{recipe.items.map((item, index) => <div key={index}><span>{ingredientById.get(item.ingredientId)?.name[locale] ?? item.ingredientId}<small>{preparationById.get(item.preparationId)?.name[locale] ?? item.preparationId}</small></span><strong>{formatNumber(item.grams, locale)} {t.grams}</strong></div>)}</div></WidgetFrame><DishAnalysis locale={locale} analysis={analysis} itemCount={recipe.items.length}/></div>
    <div className="studio-grid studio-grid--details"><SensoryProfile locale={locale} profile={analysis.profile}/><IngredientPairings locale={locale} pairs={analysis.pairResults}/></div>
  </div>;
}
