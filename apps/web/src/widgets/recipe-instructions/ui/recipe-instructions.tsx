'use client';
import { useEffect, useRef, useState } from 'react';
import { MAX_RECIPE_DESCRIPTION, MAX_RECIPE_SERVINGS, MAX_RECIPE_STEPS, MAX_STEP_TEXT, type RecipeContent } from '@flavorpilot/contracts';
import { formatNumber, getDictionary, type Locale } from '@/shared/i18n';
import { Button, Dialog, Icon, WidgetFrame } from '@/shared/ui';

function ServingsField({ value, locale, onChange, onEndEdit, onInvalid }: {
    value: number | null; locale: Locale; onChange: (value: number | null) => void; onEndEdit: () => void; onInvalid: (invalid: boolean) => void;
}) {
    const t = getDictionary(locale).messages;
    const [editing, setEditing] = useState({ value, text: value === null ? '' : String(value) });
    if (editing.value !== value) setEditing({ value, text: value === null ? '' : String(value) });
    const input = editing.value === value ? editing.text : value === null ? '' : String(value);
    const invalid = input !== '' && (!/^\d+$/.test(input) || Number(input) < 1 || Number(input) > MAX_RECIPE_SERVINGS);
    useEffect(() => { onInvalid(invalid); }, [invalid, onInvalid]);
    return <div className="field-label recipe-servings"><label htmlFor="recipe-servings">{t.recipeServings}</label>
        <input id="recipe-servings" inputMode="numeric" value={input} maxLength={5} aria-invalid={invalid}
            aria-describedby={invalid ? 'recipe-servings-error' : 'recipe-servings-hint'}
            onChange={event => {
                const text = event.target.value;
                const valid = text === '' || (/^\d+$/.test(text) && Number(text) >= 1 && Number(text) <= MAX_RECIPE_SERVINGS);
                const next = text === '' ? null : valid ? Number(text) : value;
                setEditing({ value: next, text });
                if (valid) onChange(next);
            }} onBlur={onEndEdit}/>
        {invalid ? <small id="recipe-servings-error" className="field-error">{t.recipeServingsInvalid}</small>
            : <small id="recipe-servings-hint" className="muted">{t.recipeServingsHint}</small>}
    </div>;
}

export function RecipeInstructions({ content, locale, onDescription, onServings, onAddStep, onStep, onMoveStep, onRemoveStep, onEndEdit, onServingsInvalid }: {
    content: RecipeContent; locale: Locale;
    onDescription: (value: string) => void; onServings: (value: number | null) => void;
    onAddStep: () => void; onStep: (id: string, text: string) => void;
    onMoveStep: (id: string, direction: -1 | 1) => void; onRemoveStep: (id: string) => void; onEndEdit: () => void;
    onServingsInvalid: (invalid: boolean) => void;
}) {
    const t = getDictionary(locale).messages;
    const [removing, setRemoving] = useState<string | null>(null);
    const fields = useRef(new Map<string, HTMLTextAreaElement>());
    const addButton = useRef<HTMLButtonElement>(null);
    const focusNew = useRef(false);
    return <WidgetFrame id="recipe-instructions" title={t.recipeInstructionsTitle} subtitle={t.recipeInstructionsHint} icon="book">
        <div className="stack recipe-editor">
            <label className="field-label">{t.recipeDescription}
                <textarea rows={3} maxLength={MAX_RECIPE_DESCRIPTION} value={content.description}
                    placeholder={t.recipeDescriptionPlaceholder} onChange={event => onDescription(event.target.value)} onBlur={onEndEdit}/>
            </label>
            <ServingsField value={content.servings} locale={locale} onChange={onServings} onEndEdit={onEndEdit} onInvalid={onServingsInvalid}/>
            <div className="recipe-steps-heading"><h3>{t.recipeSteps}</h3><span className="muted small">{formatNumber(content.steps.length, locale)} / {formatNumber(MAX_RECIPE_STEPS, locale)}</span></div>
            {!content.steps.length && <p className="recipe-steps-empty muted">{t.recipeStepsEmpty}</p>}
            <ol className="recipe-steps">
                {content.steps.map((step, index) => <li key={step.id} className="recipe-step">
                    <div className="recipe-step__header"><label htmlFor={`step-${step.id}`}>{t.recipeStep} {formatNumber(index + 1, locale, 0)}</label>
                        <div className="recipe-step__actions">
                            <Button variant="ghost" aria-label={`${t.recipeMoveStepUp}: ${formatNumber(index + 1, locale, 0)}`} disabled={index === 0}
                                onClick={() => { onMoveStep(step.id, -1); fields.current.get(step.id)?.focus(); }}><Icon name="chevron" className="step-arrow step-arrow--up" size={16}/></Button>
                            <Button variant="ghost" aria-label={`${t.recipeMoveStepDown}: ${formatNumber(index + 1, locale, 0)}`} disabled={index === content.steps.length - 1}
                                onClick={() => { onMoveStep(step.id, 1); fields.current.get(step.id)?.focus(); }}><Icon name="chevron" className="step-arrow step-arrow--down" size={16}/></Button>
                            <Button variant="ghost" aria-label={`${t.recipeRemoveStep}: ${formatNumber(index + 1, locale, 0)}`}
                                onClick={() => setRemoving(step.id)}><Icon name="trash" size={16}/></Button>
                        </div>
                    </div>
                    <textarea id={`step-${step.id}`} rows={4} maxLength={MAX_STEP_TEXT} value={step.text} placeholder={t.recipeStepPlaceholder}
                        ref={node => {
                            if (node) {
                                fields.current.set(step.id, node);
                                if (focusNew.current && index === content.steps.length - 1) { node.focus(); focusNew.current = false; }
                            } else fields.current.delete(step.id);
                        }} onChange={event => onStep(step.id, event.target.value)} onBlur={onEndEdit}/>
                </li>)}
            </ol>
            <button type="button" className="button button--secondary recipe-add-step" ref={addButton} disabled={content.steps.length >= MAX_RECIPE_STEPS}
                onClick={() => { focusNew.current = true; onAddStep(); }}><Icon name="plus" size={17}/>{t.recipeAddStep}</button>
            {content.steps.length >= MAX_RECIPE_STEPS && <p className="small muted">{t.recipeStepLimit}</p>}
        </div>
        <Dialog open={removing !== null} onClose={() => setRemoving(null)} title={t.recipeRemoveStepTitle} closeLabel={t.close}>
            <p>{t.recipeRemoveStepText}</p><footer className="dialog__actions"><Button onClick={() => setRemoving(null)}>{t.cancel}</Button>
                <Button variant="danger" onClick={() => {
                    if (removing) onRemoveStep(removing);
                    setRemoving(null);
                    addButton.current?.focus();
                }}>{t.delete}</Button></footer>
        </Dialog>
    </WidgetFrame>;
}
