'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/features/session';
import { localRecipes, deleteLocalRecipe, dishRepository, openRecipeDraft, recipeExport, importRecipe, type Recipe } from '@/entities/dish';
import { validateCatalog } from '@/entities/ingredient';
import { downloadJson } from '@/shared/lib/storage';
import { hasApi } from '@/shared/config';
import { getDictionary, type Locale } from '@/shared/i18n';
import { Button, Dialog, Icon, LinkButton, Notice, Skeleton } from '@/shared/ui';
import { RecipeCollection } from '@/widgets/recipe-collection';
export function LibraryScreen({ locale }: {
    locale: Locale;
}) {
    const t = getDictionary(locale).messages;
    const router = useRouter();
    const { session, loading } = useSession();
    const [source, setSource] = useState<'local' | 'cloud'>('local');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [query, setQuery] = useState('');
    const [revision, setRevision] = useState(0);
    const [selected, setSelected] = useState<Recipe | null>(null);
    const [deleting, setDeleting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const token = session?.access_token;
    useEffect(() => {
        let live = true;
        const controller = new AbortController();
        setBusy(true);
        setError('');
        setRecipes([]);
        async function load() {
            try {
                const value = source === 'local' ? localRecipes() : token && hasApi ? await dishRepository.mine(token, controller.signal) : [];
                if (live) {
                    setRecipes(value);
                    if (source === 'cloud' && (!token || !hasApi))
                        setError(!token ? t.loginRequired : t.cloudUnavailable);
                }
            }
            catch {
                if (live)
                    setError(source === 'local' ? t.storageError : t.apiUnavailable);
            }
            finally {
                if (live)
                    setBusy(false);
            }
        }
        void load();
        return () => { live = false; controller.abort(); };
    }, [source, token, revision, t.loginRequired, t.cloudUnavailable, t.storageError, t.apiUnavailable]);
    function open(recipe: Recipe) {
        try {
            openRecipeDraft(recipe, 'edit', session?.user.id ?? 'guest');
            router.push(`/${locale}/builder`);
        }
        catch {
            setError(t.storageError);
        }
    }
    async function remove() {
        if (!selected || deleting)
            return;
        setDeleting(true);
        try {
            if (selected.origin === 'local')
                deleteLocalRecipe(selected.id);
            else {
                if (!token)
                    throw new Error('AUTH');
                await dishRepository.remove(selected.id, token);
            }
            setSelected(null);
            setRevision(n => n + 1);
            setNotice(t.deleted);
        }
        catch {
            setError(t.apiError);
        }
        finally {
            setDeleting(false);
        }
    }
    async function readFile(file: File | undefined) {
        if (!file)
            return;
        try {
            if (file.size > 262144)
                throw new Error('TOO_LARGE');
            const draft = importRecipe(JSON.parse(await file.text()));
            if (!validateCatalog(draft.items))
                throw new Error('CATALOG');
            openRecipeDraft({ id: 'import', origin: 'example', createdAt: new Date().toISOString(), ...draft }, 'remix', session?.user.id ?? 'guest');
            router.push(`/${locale}/builder`);
        }
        catch {
            setError(t.importError);
        }
        finally {
            if (fileRef.current)
                fileRef.current.value = '';
        }
    }
    const visible = recipes.filter(recipe => recipe.name.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale)));
    return <div className="stack page-stack"><header className="page-heading"><div><p className="eyebrow">{t.workspace}</p><h1>{t.library}</h1><p className="muted">{t.libraryText}</p></div><LinkButton href={`/${locale}/builder`} variant="primary"><Icon name="plus" size={17}/>{t.newDish}</LinkButton></header>
    <div className="collection-toolbar"><div className="segmented" role="group" aria-label={t.source}><button type="button" aria-pressed={source === 'local'} onClick={() => setSource('local')}>{t.localRecipes}</button><button type="button" aria-pressed={source === 'cloud'} onClick={() => setSource('cloud')}>{t.cloudRecipes}</button></div><Button onClick={() => fileRef.current?.click()}><Icon name="upload" size={16}/>{t.import}</Button><input className="sr-only" type="file" accept="application/json,.json" ref={fileRef} tabIndex={-1} onChange={event => void readFile(event.target.files?.[0])}/></div>
    <label className="search-field library-search"><Icon name="search" size={18}/><span className="sr-only">{t.searchRecipes}</span><input type="search" value={query} placeholder={t.searchRecipes} onChange={event => setQuery(event.target.value)}/></label>
    {notice && <Notice tone="success">{notice}</Notice>}{source === 'local' && <p className="small muted">{t.localOnly}</p>}
    {error ? <Notice tone="error" role="alert"><p>{error}</p><div className="inline-actions"><Button onClick={() => setRevision(n => n + 1)}>{t.retry}</Button>{!token && source === 'cloud' && <LinkButton href={`/${locale}/sign-in`}>{t.signIn}</LinkButton>}</div></Notice> : busy || loading ? <Skeleton label={t.loading}/> : <RecipeCollection recipes={visible} locale={locale} onOpen={open} onDelete={setSelected} onExport={recipe => downloadJson(recipe.name, recipeExport(recipe))} emptyAction={<LinkButton href={`/${locale}/builder`}>{t.openStudio}</LinkButton>}/>}
    <Dialog open={Boolean(selected)} onClose={() => {
            if (!deleting)
                setSelected(null);
        }} title={t.deleteTitle} closeLabel={t.close}><p>{selected?.name}</p><p className="muted">{t.deleteText}</p><footer className="dialog__actions"><Button onClick={() => setSelected(null)} disabled={deleting}>{t.cancel}</Button><Button variant="danger" onClick={() => void remove()} disabled={deleting}>{deleting ? t.busy : t.delete}</Button></footer></Dialog>
  </div>;
}
