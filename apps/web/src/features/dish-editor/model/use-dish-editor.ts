'use client';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { analyzeDish, recommendedIngredientGrams } from '@flavorpilot/flavor-engine';
import { MAX_RECIPE_STEPS, MAX_STEP_TEXT, MAX_RECIPE_DESCRIPTION, MAX_RECIPE_SERVINGS, type DishItem, type IngredientRecommendation } from '@flavorpilot/contracts';
import { emptyDraft, hasDraftContent, loadWorkingDraft, saveWorkingDraft, takeStudioTransfer, fingerprint, MAX_ITEMS, type Draft, type Recipe } from '@/entities/dish';
import { ingredientById, defaultDish, validateCatalog, firstPreparation } from '@/entities/ingredient';
import { getDictionary, type Locale, type MessageKey } from '@/shared/i18n';
import { editorReducer, initialState } from './reducer';
export function useDishEditor(locale: Locale, scope = 'guest') {
    const [state, dispatch] = useReducer(editorReducer, undefined, initialState);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<MessageKey | null>(null);
    const [draftStatus, setDraftStatus] = useState<'saving' | 'saved' | 'error'>('saving');
    const [candidate, setCandidate] = useState<DishItem | null>(null);
    const [blockedStorage, setBlockedStorage] = useState(false);
    const [draftEpoch, setDraftEpoch] = useState(0);
    const loaded = useRef(false);
    const current = useRef({ draft: state.present, ready: false, blocked: false });
    current.current = { draft: state.present, ready, blocked: blockedStorage };
    useEffect(() => () => {
        const value = current.current;
        if (value.ready && !value.blocked) {
            try {
                saveWorkingDraft(value.draft, scope);
            }
            catch { /* Data is still available through explicit export while mounted. */ }
        }
    }, [scope]);
    const messages = getDictionary(locale).messages;
    const example = (): Draft => ({ ...emptyDraft(), name: messages.exampleName, goal: 'fresh', items: defaultDish.map(item => ({ ...item })) });
    useEffect(() => {
        if (loaded.current)
            return;
        loaded.current = true;
        try {
            const fromTransfer = takeStudioTransfer(scope);
            const url = new URL(window.location.href);
            const draft = fromTransfer ?? (url.searchParams.has('example') ? example() : loadWorkingDraft(scope));
            if (draft) {
                if (!validateCatalog(draft.items))
                    throw new Error('UNSUPPORTED');
                dispatch({ type: 'hydrate', draft });
            }
            // A demo link is a one-time action, not a command to discard the working draft on every reload.
            if (url.searchParams.has('example')) {
                url.searchParams.delete('example');
                window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
            }
        }
        catch {
            setError('storageError');
            setBlockedStorage(true);
            setDraftStatus('error');
        }
        setReady(true);
        // The active draft is language-independent and must not be reloaded on a locale change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        if (!ready || blockedStorage)
            return;
        setDraftStatus('saving');
        const timer = setTimeout(() => {
            try {
                saveWorkingDraft(state.present, scope);
                setDraftStatus('saved');
            }
            catch {
                setDraftStatus('error');
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [ready, blockedStorage, state.present]);
    useEffect(() => {
        if (!ready)
            return;
        const saveNow = () => {
            if (!blockedStorage) {
                try {
                    saveWorkingDraft(state.present, scope);
                }
                catch { /* beforeunload warns below */ }
            }
        };
        const beforeUnload = (event: BeforeUnloadEvent) => {
            saveNow();
            if ((blockedStorage || draftStatus === 'error') && hasDraftContent(state.present)) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('pagehide', saveNow);
        window.addEventListener('beforeunload', beforeUnload);
        return () => { window.removeEventListener('pagehide', saveNow); window.removeEventListener('beforeunload', beforeUnload); };
    }, [ready, state.present, draftStatus, blockedStorage]);
    const analysis = useMemo(() => analyzeDish(state.present.items, state.present.goal), [state.present.items, state.present.goal]);
    const previewAnalysis = useMemo(() => candidate ? analyzeDish([...state.present.items, candidate], state.present.goal, false) : null, [candidate, state.present.items, state.present.goal]);
    function replace(draft: Draft, groupKey?: string) {
        if (!validateCatalog(draft.items)) {
            setError('unsupported');
            return;
        }
        setCandidate(null);
        setError(null);
        dispatch({ type: 'replace', draft, ...(groupKey ? { group: { key: groupKey, at: Date.now() } } : {}) });
    }
    function addStep() {
        if (state.present.steps.length < MAX_RECIPE_STEPS)
            replace({ ...state.present, steps: [...state.present.steps, { id: crypto.randomUUID(), text: '' }] });
    }
    function setStep(id: string, text: string) {
        if (text.length <= MAX_STEP_TEXT)
            replace({ ...state.present, steps: state.present.steps.map(step => step.id === id ? { ...step, text } : step) }, `step:${id}`);
    }
    function moveStep(id: string, direction: -1 | 1) {
        const steps = [...state.present.steps], index = steps.findIndex(step => step.id === id), next = index + direction;
        if (index < 0 || next < 0 || next >= steps.length) return;
        [steps[index], steps[next]] = [steps[next], steps[index]];
        replace({ ...state.present, steps });
    }
    function add(ingredientId: string, grams?: number, preparationId?: string) {
        if (state.present.items.length >= MAX_ITEMS) {
            setError('limitItems');
            return;
        }
        const ingredient = ingredientById.get(ingredientId);
        const prep = preparationId ?? firstPreparation(ingredientId);
        if (!ingredient || !prep) {
            setError('unsupported');
            return;
        }
        if (state.present.items.some(item => item.ingredientId === ingredientId && item.preparationId === prep)) {
            setError('duplicate');
            return;
        }
        const amount = grams ?? recommendedIngredientGrams(ingredient, analysis.totalWeight);
        replace({ ...state.present, items: [...state.present.items, { ingredientId, preparationId: prep, grams: Math.min(5000, amount) }] });
    }
    function update(index: number, patch: Partial<DishItem>) {
        const items = state.present.items.map((item, i) => i === index ? { ...item, ...patch } : item);
        const keys = items.map(item => `${item.ingredientId}::${item.preparationId}`);
        if (new Set(keys).size !== keys.length) {
            setError('duplicate');
            return;
        }
        replace({ ...state.present, items });
    }
    function preview(recommendation: IngredientRecommendation) {
        const preparationId = firstPreparation(recommendation.ingredientId);
        if (!preparationId || !Number.isFinite(recommendation.recommendedGrams) || recommendation.recommendedGrams <= 0)
            return;
        setCandidate({ ingredientId: recommendation.ingredientId, grams: Math.min(5000, recommendation.recommendedGrams), preparationId });
    }
    function markedSaved(recipe: Recipe) {
        const draft: Draft = { ...state.present, name: recipe.name, linkedId: recipe.id, linkedOrigin: recipe.origin === 'cloud' ? 'cloud' : 'local', linkedVersionNumber:recipe.origin==='cloud' ? recipe.versionNumber : undefined, createdAt: recipe.createdAt, visibility: recipe.visibility };
        dispatch({ type: 'markSaved', draft });
    }
    return { draft: state.present, draftEpoch, analysis, previewAnalysis, candidate, error, ready, draftStatus, blockedStorage,
        dirty: fingerprint(state.present) !== state.saved, canUndo: state.past.length > 0, canRedo: state.future.length > 0,
        setName: (name: string) => replace({ ...state.present, name }, 'name'),
        setDescription: (description: string) => { if (description.length <= MAX_RECIPE_DESCRIPTION) replace({ ...state.present, description }, 'description'); },
        setServings: (servings: number | null) => { if (servings === null || (Number.isInteger(servings) && servings > 0 && servings <= MAX_RECIPE_SERVINGS)) replace({ ...state.present, servings }, 'servings'); },
        addStep, setStep, moveStep,
        removeStep: (id: string) => replace({ ...state.present, steps: state.present.steps.filter(step => step.id !== id) }),
        endEdit: () => dispatch({ type: 'endEdit' }),
        setGoal: (goal: Draft['goal']) => replace({ ...state.present, goal }),
        add, update, remove: (index: number) => replace({ ...state.present, items: state.present.items.filter((_, i) => i !== index) }),
        preview, cancelPreview: () => setCandidate(null), applyPreview: () => {
            if (candidate)
                add(candidate.ingredientId, candidate.grams, candidate.preparationId);
        },
        undo: () => { setCandidate(null); dispatch({ type: 'undo' }); }, redo: () => { setCandidate(null); dispatch({ type: 'redo' }); },
        reset: () => { setCandidate(null); setError(null); setDraftEpoch(value => value + 1); dispatch({ type: 'hydrate', draft: emptyDraft() }); },
        loadExample: () => { setCandidate(null); setError(null); setDraftEpoch(value => value + 1); dispatch({ type: 'hydrate', draft: example() }); }, replace, markedSaved,
    };
}
