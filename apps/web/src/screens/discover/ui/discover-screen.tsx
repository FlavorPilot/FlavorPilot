'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { publicDishSeeds } from '@/entities/ingredient';
import { dishRepository, type Recipe } from '@/entities/dish';
import { hasApi } from '@/shared/config';
import { getDictionary, type Locale } from '@/shared/i18n';
import { Button, EmptyState, Icon, Notice, Skeleton } from '@/shared/ui';
import { RecipeCollection } from '@/widgets/recipe-collection';
export function DiscoverScreen({ locale }: {
    locale: Locale;
}) {
    const t = getDictionary(locale).messages;
    const router = useRouter();
    const [source, setSource] = useState<'examples' | 'community'>(hasApi ? 'community' : 'examples');
    const [query, setQuery] = useState('');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const [revision, setRevision] = useState(0);
    const epoch = useRef(0);
    useEffect(() => {
        const thisEpoch = ++epoch.current;
        const controller = new AbortController();
        setError(false);
        setRecipes([]);
        setCursor(null);
        if (source === 'examples') {
            setBusy(false);
            return;
        }
        setBusy(true);
        const timer = setTimeout(() => {
            void dishRepository.publicList(query, undefined, controller.signal).then(result => {
                if (epoch.current === thisEpoch) {
                    setRecipes(result.items);
                    setCursor(result.nextCursor);
                }
            }).catch(() => {
                if (!controller.signal.aborted && epoch.current === thisEpoch)
                    setError(true);
            }).finally(() => {
                if (epoch.current === thisEpoch)
                    setBusy(false);
            });
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [source, query, revision]);
    async function more() {
        if (!cursor || busy)
            return;
        const thisEpoch = epoch.current;
        setBusy(true);
        try {
            const result = await dishRepository.publicList(query, cursor);
            if (epoch.current === thisEpoch) {
                setRecipes(current => [...current, ...result.items.filter(item => !current.some(old => old.id === item.id))]);
                setCursor(result.nextCursor);
            }
        }
        catch {
            if (epoch.current === thisEpoch)
                setError(true);
        }
        finally {
            if (epoch.current === thisEpoch)
                setBusy(false);
        }
    }
    const examples: Recipe[] = publicDishSeeds.filter(seed => seed.name[locale].toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale))).map(seed => ({ id: seed.id, name: seed.name[locale], items: seed.items, goal: seed.goal, origin: 'example', visibility: 'public', createdAt: '1970-01-01T00:00:00.000Z' }));
    return <div className="stack page-stack"><header className="page-heading"><div><p className="eyebrow">{t.discover}</p><h1>{t.discoverTitle}</h1><p className="muted">{t.discoverText}</p></div></header>
    <div className="collection-toolbar"><div className="segmented" role="group" aria-label={t.source}><button type="button" aria-pressed={source === 'examples'} onClick={() => setSource('examples')}>{t.examples}</button><button type="button" aria-pressed={source === 'community'} onClick={() => setSource('community')}>{t.community}</button></div><label className="search-field"><Icon name="search" size={18}/><span className="sr-only">{t.searchRecipes}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t.searchRecipes}/></label></div>
    {source === 'examples' && <Notice>{t.exampleNotice}</Notice>}
    {error && source === 'community' && <Notice tone="warning"><p>{t.communityError}</p><div className="inline-actions"><Button onClick={() => setRevision(n => n + 1)}>{t.retry}</Button><Button onClick={() => setSource('examples')}>{t.viewExamples}</Button></div></Notice>}
    {busy && !recipes.length ? <Skeleton label={t.loading}/> : source === 'community' && !recipes.length && !error ? <EmptyState title={t.communityEmpty} icon="compass"/> : <RecipeCollection locale={locale} recipes={source === 'examples' ? examples : recipes} onOpen={recipe => router.push(`/${locale}/dishes/${encodeURIComponent(recipe.id)}`)}/>}
    {source === 'community' && cursor && <Button onClick={() => void more()} disabled={busy}>{busy ? t.loading : t.loadMore}</Button>}
  </div>;
}
