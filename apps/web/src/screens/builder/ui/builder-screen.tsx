'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { dishAnalysisSchema } from '@flavorpilot/contracts';
import { useDishEditor } from '@/features/dish-editor';
import { RecipeShareLink } from "@/features/share-recipe";
import { SaveRecipeDialog } from '@/features/save-recipe';
import { useSession } from '@/features/session';
import { fingerprint, recipeExport, type Recipe } from '@/entities/dish';
import { request } from '@/shared/api';
import { hasApi } from '@/shared/config';
import { downloadJson } from '@/shared/lib/storage';
import { getDictionary, type Locale } from '@/shared/i18n';
import { Badge, Button, Dialog, Icon, Notice, Skeleton, WidgetBoundary } from '@/shared/ui';
import { DishToolbar } from '@/widgets/dish-toolbar';
import { DishComposition } from '@/widgets/dish-composition';
import { DishAnalysis } from '@/widgets/dish-analysis';
import { SensoryProfile } from '@/widgets/sensory-profile';
import { IngredientPairings } from '@/widgets/ingredient-pairings';
import { DishRecommendations } from '@/widgets/dish-recommendations';
import { ChangePreview } from '@/widgets/change-preview';
export function BuilderScreen({ locale }: {
    locale: Locale;
}) {
    const session = useSession();
    const t = getDictionary(locale).messages;
    if (session.loading)
        return <Skeleton label={t.sessionLoading}/>;
    return <BuilderWorkspace key={session.session?.user.id ?? 'guest'} locale={locale} scope={session.session?.user.id ?? 'guest'} token={session.session?.access_token}/>;
}
function BuilderWorkspace({ locale, scope, token }: {
    locale: Locale;
    scope: string;
    token?: string;
}) {
    const t = getDictionary(locale).messages;
    const editor = useDishEditor(locale, scope);
    const [lastSaved, setLastSaved] = useState<Recipe | null>(null);
    const [saveOpen, setSaveOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);
    const [notice, setNotice] = useState('');
    const [detail, setDetail] = useState(false);
    const [checking, setChecking] = useState(false);
    const [checkResult, setCheckResult] = useState<{
        key: string;
        text: string;
        ok: boolean;
    } | null>(null);
    const latest = useRef('');
    latest.current = fingerprint(editor.draft);
    useEffect(() => {
        try {
            setDetail(window.localStorage.getItem('flavorpilot:workspace-detail:v1') === 'detailed');
        }
        catch { /* cosmetic preference only */ }
    }, []);
    function toggleDetail(value: boolean) {
        setDetail(value);
        try {
            window.localStorage.setItem('flavorpilot:workspace-detail:v1', value ? 'detailed' : 'focused');
        }
        catch { /* no recipe content affected */ }
    }
    async function verify() {
        const key = latest.current;
        setChecking(true);
        setCheckResult(null);
        try {
            const server = await request('/flavor/analyze', value => dishAnalysisSchema.parse(value), { method: 'POST', body: { items: editor.draft.items, goal: editor.draft.goal, includeRecommendations: false } });
            if (latest.current === key) {
                const same = server.overallScore === editor.analysis.overallScore && server.balanceScore === editor.analysis.balanceScore;
                setCheckResult({ key, text: same ? t.serverChecked : t.serverMismatch, ok: same });
            }
        }
        catch {
            if (latest.current === key)
                setCheckResult({ key, text: t.apiUnavailable, ok: false });
        }
        finally {
            setChecking(false);
        }
    }
    function saved(recipe: Recipe) {
        editor.markedSaved(recipe);
        setLastSaved(recipe);
        setNotice(recipe.origin === 'local' ? t.savedLocal : t.savedCloud);
    }
    useEffect(() => { setNotice(''); }, [editor.draft.name, editor.draft.goal, editor.draft.items]);
    const fallback = <Notice tone="error" role="alert">{t.uiError} {t.uiErrorText}</Notice>;
    if (!editor.ready)
        return <Skeleton label={t.loading}/>;
    return <div className="studio">
    <header className="page-heading"><div><p className="eyebrow">{t.builder}</p><h1>{t.createTitle}</h1><p className="muted">{t.createSubtitle}</p></div><Badge>{t.knowledge}</Badge></header>
    <DishToolbar locale={locale} name={editor.draft.name} goal={editor.draft.goal} canUndo={editor.canUndo} canRedo={editor.canRedo} canSave={editor.draft.items.length > 0} onName={editor.setName} onGoal={editor.setGoal} onUndo={editor.undo} onRedo={editor.redo} onNew={() => { if (editor.draft.items.length || editor.draft.name.trim()) setResetOpen(true); else editor.reset(); }} onSave={() => setSaveOpen(true)} onExport={() => downloadJson(editor.draft.name, recipeExport(editor.draft))} draftStatus={editor.draftStatus}/>
    {editor.error && <Notice tone="error" role="alert">{t[editor.error]}</Notice>}{notice && <Notice tone="success">{notice}</Notice>}
            {notice && lastSaved && <RecipeShareLink recipe={lastSaved} locale={locale}/>}
    {editor.draft.parentDishId && <Notice>{t.basedOn}: <Link href={`/${locale}/dishes/${encodeURIComponent(editor.draft.parentDishId)}`}>{t.recipe}</Link></Notice>}
    {editor.candidate && editor.previewAnalysis && <ChangePreview locale={locale} item={editor.candidate} before={editor.analysis} after={editor.previewAnalysis} onApply={editor.applyPreview} onCancel={editor.cancelPreview}/>}
    <div className="studio-grid">
      <WidgetBoundary fallback={fallback}><DishComposition locale={locale} items={editor.draft.items} totalWeight={editor.analysis.totalWeight} onAdd={editor.add} onUpdate={editor.update} onRemove={editor.remove} onExample={editor.loadExample}/></WidgetBoundary>
      <WidgetBoundary fallback={fallback}><DishAnalysis locale={locale} analysis={editor.analysis} itemCount={editor.draft.items.length}/></WidgetBoundary>
    </div>
    <WidgetBoundary fallback={fallback}><DishRecommendations locale={locale} recommendations={editor.analysis.recommendations} onPreview={editor.preview} disabled={editor.draft.items.length >= 24}/></WidgetBoundary>
    <div className="detail-toolbar"><div className="segmented" role="group" aria-label={t.viewMode}><button type="button" aria-pressed={!detail} onClick={() => toggleDetail(false)}>{t.focused}</button><button type="button" aria-pressed={detail} onClick={() => toggleDetail(true)}><Icon name="sliders" size={15}/>{t.detailed}</button></div>{hasApi && <Button variant="ghost" disabled={checking} onClick={verify}>{checking ? t.serverChecking : t.serverCheck}</Button>}</div>
    {checkResult && checkResult.key === latest.current && <Notice tone={checkResult.ok ? 'success' : 'warning'}>{checkResult.text}</Notice>}
    {detail && <div className="studio-grid studio-grid--details"><WidgetBoundary fallback={fallback}><SensoryProfile locale={locale} profile={editor.analysis.profile}/></WidgetBoundary><WidgetBoundary fallback={fallback}><IngredientPairings locale={locale} pairs={editor.analysis.pairResults}/></WidgetBoundary></div>}
    <p className="workspace-footnote"><Icon name="info" size={15}/>{t.knowledgeNote}</p>
    {resetOpen && <Dialog open title={t.resetTitle} closeLabel={t.close} onClose={() => setResetOpen(false)}><p>{t.resetText}</p><div className="dialog__actions"><Button variant="ghost" onClick={() => setResetOpen(false)}>{t.cancel}</Button><Button onClick={() => { editor.reset(); setLastSaved(null); setResetOpen(false); }}>{t.newDish}</Button></div></Dialog>}
    {saveOpen && <SaveRecipeDialog open onClose={() => setSaveOpen(false)} draft={editor.draft} locale={locale} token={token} onSaved={saved}/>}
  </div>;
}
