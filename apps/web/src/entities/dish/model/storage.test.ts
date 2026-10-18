import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyDraft } from './types';
import { importRecipe, loadWorkingDraft, localRecipes, openRecipeDraft, recipeExport, saveLocalRecipe, saveWorkingDraft, takeStudioTransfer } from './storage';
const key = 'flavorpilot:saved-dishes:v1';
const items = [{ ingredientId: 'salmon', grams: 180, preparationId: 'raw' }];
let values: Map<string, string>;
beforeEach(() => {
    values = new Map();
    vi.stubGlobal('window', { localStorage: {
            getItem: (name: string) => values.get(name) ?? null,
            setItem: (name: string, value: string) => values.set(name, value),
            removeItem: (name: string) => values.delete(name),
        }, dispatchEvent: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());
describe('device recipes and scoped working drafts', () => {
    it('preserves the cloud source version for feedback without exporting identity metadata', () => {
        const recipe={...emptyDraft(),id:'3f304f16-c0bc-41d3-8082-28298bbe3451',name:'Versioned dish',origin:'cloud' as const,createdAt:'2026-10-18T10:00:00.000Z',items,versionNumber:3};
        openRecipeDraft(recipe,'edit','version-test');
        const draft=takeStudioTransfer('version-test')!;
        expect(draft.linkedVersionNumber).toBe(3);
        expect(draft.linkedId).toBe(recipe.id);
        const exported=recipeExport(draft,'Dish');
        expect(exported).not.toHaveProperty('linkedVersionNumber');
        expect(exported).not.toHaveProperty('linkedId');
        expect(importRecipe({...exported,linkedVersionNumber:99,linkedId:recipe.id})).not.toHaveProperty('linkedVersionNumber');
    });
    it('retains v0.3 recipe records and distinguishes local origin', () => {
        values.set(key, JSON.stringify([{ id: 'legacy-1', name: 'Legacy', goal: 'fresh', visibility: 'public', createdAt: '2026-08-20T00:00:00.000Z', items }]));
        expect(localRecipes()[0]).toMatchObject({ id: 'legacy-1', origin: 'local' });
    });
    it('does not silently replace malformed legacy data', () => {
        values.set(key, '{broken');
        expect(() => saveLocalRecipe({ ...emptyDraft(), name: 'Dish', items })).toThrow();
        expect(values.get(key)).toBe('{broken');
    });
    it('local save is private even when a source recipe was public', () => {
        const result = saveLocalRecipe({ ...emptyDraft(), name: 'Dish', items, visibility: 'public' });
        expect(result).toMatchObject({ visibility: 'private', origin: 'local' });
    });
    it('enforces the local preview limit without deleting existing records', () => {
        for (let i = 0; i < 3; i++)
            saveLocalRecipe({ ...emptyDraft(), name: `Dish ${i}`, items });
        expect(() => saveLocalRecipe({ ...emptyDraft(), name: 'Fourth', items })).toThrow('FREE_PRIVATE_DISH_LIMIT_REACHED');
        expect(localRecipes()).toHaveLength(3);
    });
    it('updates an existing local ID rather than creating a duplicate', () => {
        const first = saveLocalRecipe({ ...emptyDraft(), name: 'Dish', items });
        const updated = saveLocalRecipe({ ...emptyDraft(), name: 'Changed', items, linkedOrigin: 'local', linkedId: first.id, createdAt: first.createdAt });
        expect(updated.id).toBe(first.id);
        expect(localRecipes()).toHaveLength(1);
    });
    it('preserves editing of existing private records even when legacy data exceeds the preview limit', () => {
        const records = Array.from({ length: 4 }, (_, index) => ({ id: `legacy-${index}`, name: 'Saved', items, goal: 'fresh', visibility: 'private', createdAt: '2026-08-20T00:00:00.000Z' }));
        values.set(key, JSON.stringify(records));
        const result = saveLocalRecipe({ ...emptyDraft(), name: 'Updated', items, linkedOrigin: 'local', linkedId: records[0].id, createdAt: records[0].createdAt });
        expect(result.visibility).toBe('private');
        expect(localRecipes()).toHaveLength(4);
        expect(() => saveLocalRecipe({ ...emptyDraft(), name: 'New', items })).toThrow('FREE_PRIVATE_DISH_LIMIT_REACHED');
    });
    it('does not load a different account working draft' , () => {
        saveWorkingDraft({ ...emptyDraft(), name: 'Account A', items }, 'account-a');
        expect(loadWorkingDraft('account-a')?.name).toBe('Account A');
        expect(loadWorkingDraft('account-b')).toBeNull();
        expect(loadWorkingDraft('guest')).toBeNull();
    });
    it('imports content but never IDs, visibility or subscription claims', () => {
        const result = importRecipe({ name: 'Import', items, goal: 'balanced', linkedId: '123', ownerId: 'someone', visibility: 'public', tier: 'pro' });
        expect(result.visibility).toBe('private');
        expect(result.linkedId).toBeUndefined();
        expect(result).not.toHaveProperty('tier');
    });
    it('commits a transfer before consuming it and is safe to read twice', () => {
        openRecipeDraft({ ...emptyDraft(), id: 'example', origin: 'example', name: 'Idea', items, goal: 'fresh', visibility: 'public', createdAt: '2026-08-20T00:00:00.000Z' }, 'remix');
        expect(takeStudioTransfer()?.name).toBe('Idea');
        expect(takeStudioTransfer()).toBeNull();
        expect(loadWorkingDraft()).toMatchObject({ name: 'Idea', visibility: 'private' });
    });
    it('preserves the full instruction through local save, reopen, export and import', () => {
        const draft = { ...emptyDraft(), name: 'Written recipe', items, description: 'Serve warm', servings: 2,
            steps: [{ id: crypto.randomUUID(), text: 'Prepare the salmon.' }, { id: crypto.randomUUID(), text: 'Serve.' }] };
        const saved = saveLocalRecipe(draft);
        expect(localRecipes()[0]).toMatchObject(draft);
        openRecipeDraft(saved, 'edit');
        expect(takeStudioTransfer()).toMatchObject({ ...draft, linkedId: saved.id });
        const exported = recipeExport(draft, 'Fallback');
        expect(exported.version).toBe(2);
        expect(importRecipe(exported)).toEqual(draft);
        expect(recipeExport({ ...draft, name: '' }, 'Без назви').name).toBe('Без назви');
    });
    it('hydrates old working drafts with empty recipe content without rewriting storage', () => {
        const old = { name: 'Legacy draft', items, goal: 'balanced', visibility: 'private' };
        const raw = JSON.stringify(old);
        values.set('flavorpilot:working-draft:v2:guest', raw);
        expect(loadWorkingDraft()).toMatchObject({ ...old, description: '', servings: null, steps: [] });
        expect(values.get('flavorpilot:working-draft:v2:guest')).toBe(raw);
    });
    it('rejects malformed steps without overwriting their raw saved data', () => {
        const draft = { ...emptyDraft(), name: 'Broken steps', items, steps: [{ id: 'bad', text: 'Text' }] };
        const raw = JSON.stringify(draft);
        values.set('flavorpilot:working-draft:v2:guest', raw);
        expect(() => loadWorkingDraft()).toThrow();
        expect(() => saveWorkingDraft(draft)).toThrow();
        expect(values.get('flavorpilot:working-draft:v2:guest')).toBe(raw);
        expect(() => importRecipe({ ...draft, steps: [{ id: crypto.randomUUID(), text: 123 }] })).toThrow();
        expect(() => importRecipe({ ...draft, version: 99 })).toThrow();
    });
});
