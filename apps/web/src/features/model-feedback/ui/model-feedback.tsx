'use client';
import { useId, useState } from 'react';
import { analyzeDish, MODEL_VERSION, CATALOGUE_VERSION } from '@flavorpilot/flavor-engine';
import { feedbackAgreements, feedbackConcerns, type FeedbackRecipeSnapshot, type ModelFeedbackResponse, type NormalizedModelFeedbackRequest } from '@flavorpilot/contracts';
import { feedbackRepository } from '@/entities/feedback';
import { ApiError } from '@/shared/api';
import { hasApi } from '@/shared/config';
import { getDictionary, type Locale } from '@/shared/i18n';
import { Button, Dialog, LinkButton, Notice } from '@/shared/ui';
const agreementKeys = {matches:'feedbackMatches',partial:'feedbackPartial',missed:'feedbackMissed'} as const;

export function ModelFeedback({ recipe, dishId, dishVersionNumber, token, locale }: {
    recipe: FeedbackRecipeSnapshot; dishId?: string; dishVersionNumber?: number; token?: string; locale: Locale;
}) {
    const t = getDictionary(locale).messages;
    const noteId = useId();
    const key = JSON.stringify([dishId,dishVersionNumber,recipe]);
    const [capture,setCapture] = useState<{recipe:FeedbackRecipeSnapshot;dishId?:string;dishVersionNumber?:number;key:string} | null>(null);
    const [cooked,setCooked] = useState<boolean | null>(null);
    const [agreement,setAgreement] = useState<NormalizedModelFeedbackRequest['agreement'] | null>(null);
    const [concerns,setConcerns] = useState<NormalizedModelFeedbackRequest['concerns']>([]);
    const [note,setNote] = useState('');
    const [allowTeamReview,setAllowTeamReview] = useState(false);
    const [busy,setBusy] = useState(false), [error,setError] = useState('');
    const [saved,setSaved] = useState<{key:string;record:ModelFeedbackResponse} | null>(null);
    function open() {
        const previous = saved?.key === key ? saved.record : null;
        setCapture({recipe:structuredClone(recipe),dishId,dishVersionNumber,key});
        setCooked(previous?.cooked ?? null); setAgreement(previous?.agreement ?? null);
        setConcerns(previous?.concerns ?? []); setNote(previous?.note ?? ''); setError('');
        setAllowTeamReview(false); // Each submission requires a fresh, optional opt-in.
    }
    async function submit() {
        if (!capture || !token || cooked === null || !agreement || busy) return;
        setBusy(true); setError('');
        try {
            const record = await feedbackRepository.save({recipe:capture.recipe,...(capture.dishId ? {dishId:capture.dishId} : {}),
                ...(capture.dishVersionNumber ? {dishVersionNumber:capture.dishVersionNumber} : {}),
                modelVersion:MODEL_VERSION,catalogueVersion:CATALOGUE_VERSION,cooked,agreement,concerns,note,allowTeamReview},token);
            setSaved({key:capture.key,record}); setCapture(null);
        } catch (problem) {
            setError(problem instanceof ApiError && problem.code==='MODEL_VERSION_CHANGED' ? t.feedbackModelChanged : t.feedbackError);
        } finally { setBusy(false); }
    }
    const analysis = capture ? analyzeDish(capture.recipe.items,capture.recipe.goal,false) : null;
    return <div className="model-feedback">
      <p className="small muted">{t.feedbackInvite}</p>
      {!token ? <LinkButton href={`/${locale}/sign-in`} variant="ghost">{t.feedbackSignIn}</LinkButton>
        : !hasApi ? <p className="small muted">{t.feedbackUnavailable}</p>
        : <Button variant="ghost" onClick={open}>{saved?.key===key ? t.feedbackEdit : t.feedbackOpen}</Button>}
      {saved?.key===key && <p className="small" role="status">{t.feedbackSaved}</p>}
      <Dialog open={Boolean(capture)} title={t.feedbackTitle} closeLabel={t.close} onClose={() => {if(!busy)setCapture(null);}}>
        <p className="muted small">{t.feedbackPrivate}</p>
        <label className="check-label"><input type="checkbox" checked={allowTeamReview} disabled={busy} onChange={event=>setAllowTeamReview(event.target.checked)}/>{t.feedbackTeamConsent}</label>
        {analysis && <dl className="feedback-scores">{([['overall',analysis.overallScore],['compatibility',analysis.compatibilityScore],['balance',analysis.balanceScore],['quantity',analysis.quantityScore],['texture',analysis.textureScore]] as const).filter(([label])=>!analysis.ingredientAssessment||label!=='quantity').map(([label,value]) => <div key={label}><dt>{analysis.ingredientAssessment?t[label==='compatibility'?'assessedCompatibility':label]:t[({overall:'legacyOverall',compatibility:'legacyCompatibility',balance:'legacyBalance',quantity:'legacyQuantity',texture:'legacyTexture'} as const)[label]]}</dt><dd>{value===null?t.unknown:`${value}/100`}</dd></div>)}</dl>}
        <fieldset className="feedback-fieldset" disabled={busy}><legend>{t.feedbackCooked}</legend>
          <label className="check-label"><input type="radio" name="feedback-cooked" checked={cooked===true} onChange={() => setCooked(true)}/>{t.feedbackCookedYes}</label>
          <label className="check-label"><input type="radio" name="feedback-cooked" checked={cooked===false} onChange={() => setCooked(false)}/>{t.feedbackCookedNo}</label>
        </fieldset>
        <fieldset className="feedback-fieldset" disabled={busy}><legend>{cooked===false ? t.feedbackExpectation : t.feedbackAgreement}</legend>
          {feedbackAgreements.map(value => <label className="check-label" key={value}><input type="radio" name="feedback-agreement" checked={agreement===value} onChange={() => {setAgreement(value);if(value==='matches')setConcerns([]);}}/>{t[agreementKeys[value]]}</label>)}
        </fieldset>
        {agreement && agreement!=='matches' && <fieldset className="feedback-fieldset" disabled={busy}><legend>{t.feedbackConcerns}</legend>{feedbackConcerns.map(value => <label className="check-label" key={value}><input type="checkbox" checked={concerns.includes(value)} onChange={event => setConcerns(event.target.checked ? [...concerns,value] : concerns.filter(item => item!==value))}/>{t[value]}</label>)}</fieldset>}
        <div className="feedback-note"><label htmlFor={noteId}>{t.feedbackNote}</label><textarea id={noteId} rows={3} maxLength={2000} value={note} disabled={busy} onChange={event => setNote(event.target.value)}/></div>
        {error && <Notice tone="error" role="alert">{error}</Notice>}
        <footer className="dialog__actions"><Button disabled={busy} onClick={() => setCapture(null)}>{t.cancel}</Button><Button variant="primary" disabled={busy || cooked===null || !agreement} onClick={() => void submit()}>{busy ? t.busy : t.feedbackSubmit}</Button></footer>
      </Dialog>
    </div>;
}
