/**
 * Static visual fixture generator. This is NOT a React/Next runtime or E2E test.
 * It renders the source components' initial JSX tree with fixed sample data to
 * inspect CSS layout offline. Hooks are intentionally inert. Scores are obtained from the real locally compiled kernel, not mock numbers.
 * React lifecycle and application networking are NOT exercised. Never import this harness into application code.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../apps/web/src');
const out = path.resolve(__dirname, '../../docs/previews');
fs.mkdirSync(out, { recursive: true });
let nextId = 0;
let locale = 'en';
const Fragment = Symbol('fragment');
const jsx = (type, props, key) => ({ type, props: props || {}, key });
class Component {
    constructor(props) { this.props = props; this.state = {}; }
}
const react = { Component, Fragment, useState: v => [typeof v === 'function' ? v() : v, () => { }], useEffect: () => { }, useMemo: f => f(), useRef: v => ({ current: v }), useId: () => `fixture-${++nextId}` };
const { dishGoals } = require('../../.core-test/contracts/src/domain.js');
const { ingredients, ingredientById, preparationById, defaultDish } = require('../../.core-test/flavor-engine/src/ingredients.js');
const { analyzeDish } = require('../../.core-test/flavor-engine/src/engine.js');
const stubs = { react, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment }, 'next/link': { __esModule: true, default: props => jsx('a', props) }, 'next/navigation': { usePathname: () => `/${locale}/builder` }, '@/features/session': { useSession: () => ({ session: null, loading: false }) }, '@flavorpilot/contracts': { dishGoals }, '@/entities/ingredient': { ingredients, ingredientById, preparationById, firstPreparation: () => 'raw' }, '@/entities/dish': { MAX_ITEMS: 24, parseAmount: v => Number(v) || null } };
const cache = new Map();
function load(file) {
    if (cache.has(file))
        return cache.get(file).exports;
    const source = fs.readFileSync(file, 'utf8');
    const result = ts.transpileModule(source, { fileName: file, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const module = { exports: {} };
    cache.set(file, module);
    function localRequire(id) {
        if (stubs[id])
            return stubs[id];
        const stem = id.startsWith('@/') ? path.join(root, id.slice(2)) : path.resolve(path.dirname(file), id);
        const resolved = [stem, stem + '.ts', stem + '.tsx', path.join(stem, 'index.ts'), path.join(stem, 'index.tsx')].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
        if (!resolved)
            throw new Error('Fixture cannot resolve ' + id + ' from ' + file);
        return load(resolved);
    }
    vm.runInThisContext(`(function(require,module,exports){${result}\n})`, { filename: file })(localRequire, module, module.exports);
    return module.exports;
}
const esc = v => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const attrNames = { className: 'class', htmlFor: 'for', tabIndex: 'tabindex', autoComplete: 'autocomplete', inputMode: 'inputmode', maxLength: 'maxlength', hrefLang: 'hreflang', viewBox: 'viewBox', strokeWidth: 'stroke-width', strokeLinecap: 'stroke-linecap', strokeLinejoin: 'stroke-linejoin' };
const booleanAttrs = new Set(['disabled', 'hidden', 'checked', 'open', 'selected', 'multiple', 'required', 'autoFocus']);
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
function render(node) {
    if (node == null || typeof node === 'boolean')
        return '';
    if (Array.isArray(node))
        return node.map(render).join('');
    if (typeof node === 'string' || typeof node === 'number')
        return esc(node);
    if (node.type === Fragment)
        return render(node.props.children);
    if (typeof node.type === 'function') {
        if (node.type.prototype instanceof Component)
            return render(new node.type(node.props).render());
        return render(node.type(node.props));
    }
    let attrs = '';
    for (const [k, v] of Object.entries(node.props)) {
        if (k === 'children' || k === 'key' || k === 'ref' || k.startsWith('on') || v == null)
            continue;
        if (k === 'style') {
            attrs += ' style="' + esc(Object.entries(v).map(([key, value]) => `${key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${typeof value === 'number' && value !== 0 && !['opacity', 'flex', 'zIndex', 'fontWeight', 'lineHeight'].includes(key) ? value + 'px' : value}`).join(';')) + '"';
            continue;
        }
        if (booleanAttrs.has(k)) {
            if (v)
                attrs += ' ' + k.toLowerCase();
            continue;
        }
        attrs += ' ' + (attrNames[k] || k) + '="' + esc(v) + '"';
    }
    let children = node.props.children;
    if (node.type === 'select' && node.props.value !== undefined) {
        children = (Array.isArray(children) ? children : [children]).map(child => child && child.type === 'option' ? { ...child, props: { ...child.props, selected: String(child.props.value) === String(node.props.value) } } : child);
    }
    return '<' + node.type + attrs + '>' + (voidTags.has(node.type) ? '' : render(children) + '</' + node.type + '>');
}
const get = relative => load(path.join(root, relative));
const { AppShell } = get('widgets/app-shell/index.ts');
const { DishToolbar } = get('widgets/dish-toolbar/index.ts');
const { DishComposition } = get('widgets/dish-composition/index.ts');
const { DishAnalysis } = get('widgets/dish-analysis/index.ts');
const { DishRecommendations } = get('widgets/dish-recommendations/index.ts');
const { SensoryProfile } = get('widgets/sensory-profile/index.ts');
const { IngredientPairings } = get('widgets/ingredient-pairings/index.ts');
const { ChangePreview } = get('widgets/change-preview/index.ts');
const { getDictionary } = get('shared/i18n/index.ts');
const { Badge, Icon } = get('shared/ui/index.ts');
const items = defaultDish;
const analysis = analyzeDish(items, 'fresh');
const recommendations = analysis.recommendations;
const noop = () => { };
const css = fs.readFileSync(path.join(root, 'shared/styles/tokens.css'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'shared/styles/global.css'), 'utf8').replace("@import './tokens.css';", '');
for (locale of ['en', 'uk']) {
    const t = getDictionary(locale).messages;
    nextId = 0;
    const body = jsx(AppShell, { locale, children: jsx('div', { className: 'studio', children: [
                jsx('header', { className: 'page-heading', children: [jsx('div', { children: [jsx('p', { className: 'eyebrow', children: t.builder }), jsx('h1', { children: t.createTitle }), jsx('p', { className: 'muted', children: t.createSubtitle })] }), jsx(Badge, { children: t.knowledge })] }),
                jsx(DishToolbar, { locale, name: t.exampleName, goal: 'fresh', canUndo: true, canRedo: false, canSave: true, onName: noop, onGoal: noop, onUndo: noop, onRedo: noop, onNew: noop, onSave: noop, onExport: noop, draftStatus: 'saved' }),
                jsx('div', { className: 'studio-grid', children: [jsx(DishComposition, { locale, items, totalWeight: 313, onAdd: noop, onUpdate: noop, onRemove: noop, onExample: noop }), jsx(DishAnalysis, { locale, analysis, itemCount: 4 })] }),
                jsx(DishRecommendations, { locale, recommendations, onPreview: noop }),
                jsx('div', { className: 'detail-toolbar', children: jsx('div', { className: 'segmented', children: [jsx('button', { type: 'button', 'aria-pressed': true, children: t.focused }), jsx('button', { type: 'button', 'aria-pressed': false, children: t.detailed })] }) }),
                jsx('p', { className: 'workspace-footnote', children: [jsx(Icon, { name: 'info', size: 15 }), t.knowledgeNote] }),
                jsx('p', { className: 'fixture-disclaimer', children: locale === 'uk' ? 'Статична перевірка компонування. Оцінки — результат демонстраційної моделі; кнопки тут не виконують дій. Не є перевіркою Next.js.' : 'Static layout fixture. Scores come from the experimental model; buttons here do not perform actions. Not a Next.js runtime test.' })
            ] }) });
    fs.writeFileSync(path.join(out, `studio-${locale}.html`), '<!doctype html><html lang="' + locale + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FlavorPilot · Static widget preview</title><style>' + css + '\n.fixture-disclaimer{font-size:12px;color:var(--muted);border-top:1px solid var(--border);padding-top:15px}</style></head><body>' + render(body) + '</body></html>');
}
console.log('2 static fixtures written from source widgets. Real kernel values; no React lifecycle, Next build or network assertion.');
