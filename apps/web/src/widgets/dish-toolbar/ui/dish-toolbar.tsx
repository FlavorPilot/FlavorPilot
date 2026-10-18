'use client';
import { dishGoals, type DishGoal } from '@flavorpilot/contracts';
import { getDictionary, type Locale } from '@/shared/i18n';
import { Button, Icon } from '@/shared/ui';
export function DishToolbar({ locale, name, goal, canUndo, canRedo, canSave, canExport = canSave, onName, onGoal, onUndo, onRedo, onNew, onSave, onExport, draftStatus }: {
    locale: Locale;
    name: string;
    goal: DishGoal;
    canUndo: boolean;
    canRedo: boolean;
    canSave: boolean;
    canExport?: boolean;
    onName: (name: string) => void;
    onGoal: (goal: DishGoal) => void;
    onUndo: () => void;
    onRedo: () => void;
    onNew: () => void;
    onSave: () => void;
    onExport: () => void;
    draftStatus: 'saving' | 'saved' | 'error';
}) {
    const d = getDictionary(locale);
    const t = d.messages;
    return <section className="dish-toolbar" aria-label={t.dishName}>
    <div className="dish-toolbar__top"><label className="recipe-name"><span className="field-label">{t.dishName}</span><input value={name} maxLength={160} placeholder={t.untitled} onChange={event => onName(event.target.value)}/></label>
      <div className="dish-toolbar__actions"><div className="undo-group"><button className="icon-button" type="button" aria-label={t.undo} title={t.undo} disabled={!canUndo} onClick={onUndo}><Icon name="undo" size={19}/></button><button className="icon-button" type="button" aria-label={t.redo} title={t.redo} disabled={!canRedo} onClick={onRedo}><Icon name="redo" size={19}/></button></div><Button variant="ghost" onClick={onNew}>{t.newDish}</Button><Button onClick={onExport} disabled={!canExport}><Icon name="download" size={17}/><span>{t.export}</span></Button><Button variant="primary" onClick={onSave} disabled={!canSave}><Icon name="save" size={17}/>{t.save}</Button></div>
    </div>
    <div className="dish-toolbar__bottom"><label className="direction"><span>{t.direction}</span><select value={goal} onChange={event => onGoal(event.target.value as DishGoal)}>{dishGoals.map(value => <option key={value} value={value}>{d.goals[value]}</option>)}</select></label><p className={`draft-state ${draftStatus === 'error' ? 'is-error' : ''}`} role="status"><Icon name={draftStatus === 'error' ? 'warning' : 'check'} size={14}/>{draftStatus === 'saved' ? t.draftAutosaved : draftStatus === 'error' ? t.draftUnstored : t.draftSaving}</p></div>
  </section>;
}
