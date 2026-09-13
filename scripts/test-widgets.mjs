/** Dependency-light runtime tests for pure models. No React, Next or network is emulated. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'apps/web/src');
const cache = new Map();
function load(relative) {
    if (cache.has(relative))
        return cache.get(relative);
    const text = fs.readFileSync(path.join(source, relative), 'utf8');
    const { outputText } = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } });
    const module = { exports: {} };
    const sandbox = { module, exports: module.exports, require: (name) => {
            if (name === '@/entities/dish')
                return load('entities/dish/model/types.ts');
            throw new Error('Pure-model test tried to load a non-model dependency: ' + name);
        } };
    vm.runInNewContext(outputText, sandbox, { filename: relative });
    cache.set(relative, module.exports);
    return module.exports;
}
const model = load('entities/dish/model/types.ts');
const { editorReducer, initialState } = load('features/dish-editor/model/reducer.ts');
const { preferredLocale } = load('shared/lib/locale-routing/index.ts');
const { en } = load('shared/i18n/en.ts');
const { uk } = load('shared/i18n/uk.ts');
let count = 0;
function test(name, fn) { fn(); count++; console.log('PASS', name); }
const item = { ingredientId: 'salmon', preparationId: 'raw', grams: 180 };
test('decimal input accepts dot and comma', () => { assert.equal(model.parseAmount('12,5'), 12.5); assert.equal(model.parseAmount('.5'), .5); assert.equal(model.parseAmount(' 5000 '), 5000); });
test('invalid temporary input cannot become a quantity', () => {
    for (const text of ['', ' ', '-1', '0', '0.0', '5000.1', '2g', 'Infinity', 'NaN', '1e3'])
        assert.equal(model.parseAmount(text), null, text);
});
test('empty state is private and has no invented recipe', () => { const state = initialState(); assert.equal(state.present.items.length, 0); assert.equal(state.present.visibility, 'private'); });
test('editing is immutable', () => { const state = initialState(); const next = editorReducer(state, { type: 'replace', draft: { ...model.emptyDraft(), items: [item] } }); assert.equal(state.present.items.length, 0); assert.equal(next.present.items.length, 1); });
test('duplicate ingredient/preparation is rejected', () => { assert.equal(model.canUseItems([item, item]), false); assert.equal(model.canUseItems([item, { ...item, preparationId: 'seared' }]), true); });
test('24 item boundary is consistent with contracts', () => { const items = Array.from({ length: 24 }, (_, i) => ({ ...item, ingredientId: String(i) })); assert.equal(model.canUseItems(items), true); assert.equal(model.canUseItems([...items, { ...item, ingredientId: 'extra' }]), false); });
test('non-finite and negative quantities are rejected', () => {
    for (const grams of [0, -1, NaN, Infinity, 5001])
        assert.equal(model.canUseItems([{ ...item, grams }]), false);
});
test('undo restores and redo reapplies', () => { const s = editorReducer(initialState(), { type: 'replace', draft: { ...model.emptyDraft(), items: [item] } }); const u = editorReducer(s, { type: 'undo' }); assert.equal(u.present.items.length, 0); assert.equal(editorReducer(u, { type: 'redo' }).present.items[0].grams, 180); });
test('new edits invalidate redo', () => { let s = editorReducer(initialState(), { type: 'replace', draft: { ...model.emptyDraft(), name: 'a' } }); s = editorReducer(s, { type: 'undo' }); s = editorReducer(s, { type: 'replace', draft: { ...model.emptyDraft(), name: 'b' } }); assert.equal(s.future.length, 0); });
test('saved ID survives undo and prevents accidental duplicate save', () => { let s = editorReducer(initialState(), { type: 'replace', draft: { ...model.emptyDraft(), items: [item] } }); s = editorReducer(s, { type: 'replace', draft: { ...s.present, name: 'b' } }); s = editorReducer(s, { type: 'markSaved', draft: { ...s.present, linkedId: 'saved-1', linkedOrigin: 'cloud' } }); assert.equal(editorReducer(s, { type: 'undo' }).present.linkedId, 'saved-1'); });
test('history is bounded to 50', () => {
    let s = initialState();
    for (let i = 0; i < 100; i++)
        s = editorReducer(s, { type: 'replace', draft: { ...s.present, name: String(i) } });
    assert.equal(s.past.length, 50);
});
test('identical replacements do not create history', () => { const s = initialState(); assert.equal(editorReducer(s, { type: 'replace', draft: s.present }), s); });
test('invalid hydration is not adopted', () => { const s = initialState(); assert.equal(editorReducer(s, { type: 'hydrate', draft: { ...s.present, items: [item, item] } }), s); });
test('locale quality and regional tags', () => { assert.equal(preferredLocale('en;q=0.6,uk-UA;q=0.9'), 'uk'); assert.equal(preferredLocale('uk;q=0,en;q=0.5'), 'en'); });
test('locale preference only accepts en and uk', () => { assert.equal(preferredLocale('uk', 'en'), 'en'); assert.equal(preferredLocale('en', 'ru'), 'en'); assert.equal(preferredLocale('de,fr'), 'en'); });
test('all dictionary groups and keys match', () => {
    assert.deepEqual(Object.keys(en).sort(), Object.keys(uk).sort());
    for (const group of Object.keys(en)) {
        assert.deepEqual(Object.keys(en[group]).sort(), Object.keys(uk[group]).sort());
        for (const value of Object.values(uk[group]))
            assert.ok(typeof value === 'string' && value.trim().length > 0);
    }
});
console.log(`\n${count} pure-model/localization runtime checks passed with TypeScript ${ts.version}.`);
console.log('This does not replace full dependency-aware TypeScript, Next/Nest build, real Supabase tests or Playwright E2E.');
