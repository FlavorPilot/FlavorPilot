'use client';
import { useState } from 'react';
import Link from 'next/link';
import { dishRepository, saveLocalRecipe, type Draft, type Recipe } from '@/entities/dish';
import { hasApi } from '@/shared/config';
import { ApiError } from '@/shared/api';
import { getDictionary, type Locale } from '@/shared/i18n';
import { Badge, Button, Dialog, Icon, Notice } from '@/shared/ui';
export function SaveRecipeDialog({ open, onClose, draft, locale, token, onSaved }: {
    open: boolean;
    onClose: () => void;
    draft: Draft;
    locale: Locale;
    token?: string;
    onSaved: (recipe: Recipe) => void;
}) {
    const t = getDictionary(locale).messages;
    const [destination, setDestination] = useState<'local' | 'cloud'>(draft.linkedOrigin === 'local' ? 'local' : token && hasApi ? 'cloud' : 'local');
    const [visibility, setVisibility] = useState<Draft['visibility']>(draft.linkedOrigin === 'cloud' ? draft.visibility : 'private');
    const [consent, setConsent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    async function save() {
        if (busy)
            return;
        if (!draft.name.trim() || draft.name.trim().length > 160) {
            setError(t.invalidName);
            return;
        }
        if (!draft.items.length || (destination === 'cloud' && visibility !== 'private' && !consent))
            return;
        setBusy(true);
        setError('');
        try {
            let recipe: Recipe;
            if (destination === 'local')
                recipe = saveLocalRecipe(draft);
            else {
                if (!token || !hasApi)
                    throw new ApiError(401, 'AUTH_REQUIRED');
                const data = { name: draft.name.trim(), items: draft.items, goal: draft.goal, visibility };
                recipe = draft.linkedOrigin === 'cloud' && draft.linkedId
                    ? await dishRepository.update(draft.linkedId, data, token)
                    : await dishRepository.create({ ...data, ...(draft.parentDishId ? { parentDishId: draft.parentDishId } : {}) }, token);
            }
            onSaved(recipe);
            onClose();
        }
        catch (problem) {
            const code = problem instanceof ApiError ? problem.code : problem instanceof Error ? problem.message : '';
            setError(code.includes('PRIVATE_DISH_LIMIT') ? t.privateLimit : t.saveError);
        }
        finally {
            setBusy(false);
        }
    }
    return <Dialog open={open} onClose={() => {
            if (!busy)
                onClose();
        }} title={t.saveTitle} closeLabel={t.close}>
    <p className="muted">{t.saveSubtitle}</p>
    <div className="choice-grid" role="group" aria-label={t.source}>
      {(['local', 'cloud'] as const).map(value => <button type="button" className={`choice ${destination === value ? 'is-selected' : ''}`} key={value} aria-pressed={destination === value} disabled={busy || (value === 'cloud' && (!token || !hasApi))} onClick={() => { setDestination(value); setConsent(false); setError(''); }}>
        <Icon name={value === 'local' ? 'save' : 'user'}/><strong>{value === 'local' ? t.localDestination : t.cloudDestination}</strong>
        <small>{value === 'local' ? t.localSaveHint : t.cloudSaveHint}</small>
      </button>)}
    </div>
    {!token && <p className="small"><Link href={`/${locale}/sign-in`}>{t.signInToSave}</Link></p>}
    {destination === 'local' ? <Notice><Badge><Icon name="lock" size={13}/>{t.private}</Badge><p>{t.localOnly}</p></Notice> :
            <fieldset className="visibility"><legend>{t.visibility}</legend>{(['private', 'unlisted', 'public'] as const).map(value => <label className="visibility-option" key={value}>
        <input type="radio" name="visibility" value={value} checked={visibility === value} disabled={busy} onChange={() => { setVisibility(value); setConsent(false); }}/>
        <Icon name={value === 'private' ? 'lock' : value === 'public' ? 'globe' : 'link'}/><span><strong>{t[value]}</strong><small>{t[`${value}Hint`]}</small></span>
      </label>)}</fieldset>}
    {destination === 'cloud' && visibility !== 'private' && <div className="stack"><label className="check-label"><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)}/><span>{visibility === 'public' ? t.publishConsent : t.linkConsent}</span></label><p className="small muted">{t.publicationWarning}</p></div>}
    {error && <Notice tone="error" role="alert">{error}</Notice>}
    <footer className="dialog__actions"><Button onClick={onClose} disabled={busy}>{t.cancel}</Button><Button variant="primary" onClick={save} disabled={busy || !draft.items.length || (destination === 'cloud' && visibility !== 'private' && !consent)}><Icon name="save" size={17}/>{busy ? t.saving : t.save}</Button></footer>
  </Dialog>;
}
