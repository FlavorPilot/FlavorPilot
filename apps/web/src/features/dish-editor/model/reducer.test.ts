import { describe, it, expect } from 'vitest';
import { editorReducer, initialState } from './reducer';
import { emptyDraft, parseAmount, canUseItems } from '@/entities/dish';
const item = { ingredientId: 'salmon', preparationId: 'raw', grams: 180 };
describe('widget editor model', () => {
    it('groups consecutive text entry and restores complete instructions with undo/redo', () => {
        const draft = { ...emptyDraft(), steps: [{ id: crypto.randomUUID(), text: '' }] };
        let state = editorReducer(initialState(), { type: 'hydrate', draft });
        for (const [text, at] of [['Chop', 100], ['Chop finely', 200]] as const) {
            state = editorReducer(state, { type: 'replace', draft: { ...state.present, steps: [{ ...draft.steps[0], text }] }, group: { key: 'step', at } });
        }
        expect(state.past).toHaveLength(1);
        const undone = editorReducer(state, { type: 'undo' });
        expect(undone.present.steps[0].text).toBe('');
        expect(editorReducer(undone, { type: 'redo' }).present.steps[0].text).toBe('Chop finely');
        state = editorReducer(state, { type: 'replace', draft: { ...state.present, description: 'Fresh', servings: 2 }, group: { key: 'description', at: 300 } });
        expect(state.past).toHaveLength(2);
        state = editorReducer(state, { type: 'endEdit' });
        state = editorReducer(state, { type: 'replace', draft: { ...state.present, description: 'Fresh dish' }, group: { key: 'description', at: 400 } });
        expect(state.past).toHaveLength(3);
        state = editorReducer(state, { type: 'replace', draft: { ...state.present, description: 'Fresh dish, served cold' }, group: { key: 'description', at: 2000 } });
        expect(state.past).toHaveLength(4);
    });
    it('accepts decimal comma, rejects NaN, zero, negative, infinity and units', () => {
        expect(parseAmount('12,5')).toBe(12.5);
        for (const value of ['', '0', '-1', 'Infinity', 'NaN', '2g', '5001'])
            expect(parseAmount(value)).toBeNull();
    });
    it('does not mutate existing drafts', () => {
        const original = initialState();
        const changed = editorReducer(original, { type: 'replace', draft: { ...emptyDraft(), items: [item] } });
        expect(original.present.items).toHaveLength(0);
        expect(changed.present.items).toHaveLength(1);
    });
    it('undo and redo restore the composition', () => {
        const added = editorReducer(initialState(), { type: 'replace', draft: { ...emptyDraft(), items: [item] } });
        const undone = editorReducer(added, { type: 'undo' });
        expect(undone.present.items).toHaveLength(0);
        expect(editorReducer(undone, { type: 'redo' }).present.items).toEqual([item]);
    });
    it('drops redo history after a new action', () => {
        let state = editorReducer(initialState(), { type: 'replace', draft: { ...emptyDraft(), name: 'A' } });
        state = editorReducer(state, { type: 'undo' });
        state = editorReducer(state, { type: 'replace', draft: { ...emptyDraft(), name: 'B' } });
        expect(state.future).toHaveLength(0);
    });
    it('keeps saved recipe identity after undo', () => {
        let state = editorReducer(initialState(), { type: 'replace', draft: { ...emptyDraft(), items: [item] } });
        state = editorReducer(state, { type: 'replace', draft: { ...state.present, name: 'Recipe' } });
        state = editorReducer(state, { type: 'markSaved', draft: { ...state.present, linkedId: 'id-1', linkedOrigin: 'local' } });
        expect(editorReducer(state, { type: 'undo' }).present.linkedId).toBe('id-1');
    });
    it('rejects duplicate ingredient/preparation combinations', () => { expect(canUseItems([item, item])).toBe(false); expect(canUseItems([item, { ...item, preparationId: 'seared' }])).toBe(true); });
    it('caps history at 50 and composition at 24', () => {
        let state = initialState();
        for (let i = 0; i < 70; i++)
            state = editorReducer(state, { type: 'replace', draft: { ...state.present, name: String(i) } });
        expect(state.past).toHaveLength(50);
        expect(canUseItems(Array.from({ length: 25 }, (_, i) => ({ ...item, ingredientId: String(i) })))).toBe(false);
    });
});
