import type { Draft } from '@/entities/dish';
import { canUseItems, emptyDraft, fingerprint } from '@/entities/dish';
export interface EditorState {
    present: Draft;
    past: Draft[];
    future: Draft[];
    saved: string;
}
export type EditorAction = {
    type: 'replace';
    draft: Draft;
} | {
    type: 'hydrate';
    draft: Draft;
} | {
    type: 'undo';
} | {
    type: 'redo';
} | {
    type: 'markSaved';
    draft: Draft;
};
export const initialState = (): EditorState => ({ present: emptyDraft(), past: [], future: [], saved: '' });
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
    switch (action.type) {
        case 'hydrate': return canUseItems(action.draft.items) ? { present: action.draft, past: [], future: [], saved: fingerprint(action.draft) } : state;
        case 'replace':
            if (!canUseItems(action.draft.items) || fingerprint(action.draft) === fingerprint(state.present))
                return state;
            return { ...state, present: action.draft, past: [...state.past, state.present].slice(-50), future: [] };
        case 'undo': {
            const previous = state.past.at(-1);
            if (!previous)
                return state;
            return { ...state, present: previous, past: state.past.slice(0, -1), future: [state.present, ...state.future].slice(0, 50) };
        }
        case 'redo': {
            const next = state.future[0];
            if (!next)
                return state;
            return { ...state, present: next, past: [...state.past, state.present].slice(-50), future: state.future.slice(1) };
        }
        case 'markSaved': {
            const attach = (draft: Draft): Draft => ({ ...draft, linkedId: action.draft.linkedId, linkedOrigin: action.draft.linkedOrigin, createdAt: action.draft.createdAt });
            return { ...state, present: action.draft, past: state.past.map(attach), future: state.future.map(attach), saved: fingerprint(action.draft) };
        }
    }
}
