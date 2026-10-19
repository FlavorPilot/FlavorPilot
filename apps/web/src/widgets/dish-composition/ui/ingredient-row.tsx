'use client';
import {useEffect,useId,useRef,useState} from 'react';
import type {DishItem} from '@flavorpilot/contracts';
import {ingredientById,preparationById,amountReference,changeInputQuantity,changeInputUnit,type InputUnit} from '@/entities/ingredient';
import {parseAmount} from '@/entities/dish';
import {getDictionary,formatNumber,type Locale} from '@/shared/i18n';
import {Icon} from '@/shared/ui';

function DecimalField({value,label,error,maximum=5000,accept,onValue}:{value:number;label:string;error:string;maximum?:number;accept?:(n:number)=>boolean;onValue:(n:number)=>void}){
 const [text,setText]=useState(String(value)),[invalid,setInvalid]=useState(false);
 const id=useId(),editing=useRef(false);
 useEffect(()=>{if(!editing.current){setText(String(value));setInvalid(false);}},[value]);
 const valid=(text:string)=>{const parsed=parseAmount(text,maximum);return parsed!==null&&(!accept||accept(parsed))?parsed:null;};
 return <><input id={id} aria-label={label} inputMode="decimal" value={text} aria-invalid={invalid} aria-describedby={invalid?`${id}-error`:undefined}
  onFocus={()=>{editing.current=true;}} onChange={event=>{const next=event.target.value;setText(next);const parsed=valid(next);setInvalid(parsed===null);if(parsed!==null)onValue(parsed);}}
  onBlur={()=>{editing.current=false;if(valid(text)===null)setInvalid(true);else setText(String(value));}}
  onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();event.currentTarget.blur();}if(event.key==='Escape'){setText(String(value));setInvalid(false);}}}/>
  {invalid&&<p id={`${id}-error`} className="field-error" role="alert">{error}</p>}</>;
}

export function IngredientRow({item,index,locale,onChange,onRemove}:{item:DishItem;index:number;locale:Locale;onChange:(patch:Partial<DishItem>)=>void;onRemove:()=>void}){
 const ingredient=ingredientById.get(item.ingredientId),reference=amountReference(item.ingredientId),dictionary=getDictionary(locale),t=dictionary.messages;
 if(!ingredient)return null;
 const unit=item.amount?.unit??'g',unitLabel=unit==='g'?t.grams:unit==='ml'?t.millilitres:t.pieces;
 const units:InputUnit[]=reference?['g',reference.unit]:['g'];
 return <div className="ingredient-row" data-testid="ingredient-row">
  <div className="ingredient-row__name"><span className="ingredient-index">{String(index+1).padStart(2,'0')}</span><div><strong>{ingredient.name[locale]}</strong><small>{item.amount&&reference?dictionary.portionLabels[reference.labelKey as keyof typeof dictionary.portionLabels]:ingredient.category[locale]}</small></div></div>
  <div className="ingredient-row__amount"><div className="amount-entry">
   <DecimalField key={unit} value={item.amount?.quantity??item.grams} label={`${ingredient.name[locale]} — ${t.amount}`} error={t.invalidUnitAmount} maximum={1000000}
    accept={n=>changeInputQuantity(item,n)!==null} onValue={n=>{const next=changeInputQuantity(item,n);if(next)onChange({grams:next.grams,amount:next.amount});}}/>
   {units.length>1?<select aria-label={`${ingredient.name[locale]} — ${t.amountUnit}`} value={unit} onChange={event=>{const next=changeInputUnit(item,event.target.value as InputUnit);if(next)onChange({grams:next.grams,amount:next.amount});}}>{units.map(u=><option key={u} value={u}>{u==='g'?t.grams:u==='ml'?t.millilitres:t.pieces}</option>)}</select>:<span>{unitLabel}</span>}
  </div>{item.amount&&<small className="amount-equivalent">≈ {formatNumber(item.grams,locale,3)} {t.grams}</small>}</div>
  <label className="ingredient-row__prep"><span className="sr-only">{ingredient.name[locale]} — {t.preparation}</span><select value={item.preparationId} onChange={event=>onChange({preparationId:event.target.value})}>{ingredient.preparations.map(prep=><option key={prep} value={prep}>{preparationById.get(prep)?.name[locale]??prep}</option>)}</select></label>
  <button type="button" className="icon-button ingredient-row__remove" aria-label={`${t.remove} ${ingredient.name[locale]}`} onClick={onRemove}><Icon name="close" size={17}/></button>
  {item.amount&&reference&&<details className="ingredient-row__conversion"><summary>{t.adjustEdibleWeight}</summary><p>{t.unitEstimateNote}</p><p>{dictionary.portionLabels[reference.labelKey as keyof typeof dictionary.portionLabels]} · 1 {unitLabel} ≈ {formatNumber(reference.gramsPerUnit,locale,3)} {t.grams}</p>
   <label>{t.edibleWeight}<DecimalField value={item.grams} label={`${ingredient.name[locale]} — ${t.edibleWeight}`} error={t.invalidAmount} accept={n=>Math.round(n*1000)>0} onValue={n=>onChange({grams:Math.round(n*1000)/1000,amount:{...item.amount!,gramsPerUnit:(Math.round(n*1000)/1000)/item.amount!.quantity}})}/></label>
   <a href={`https://fdc.nal.usda.gov/food-details/${reference.fdcId}/nutrients`} target="_blank" rel="noreferrer">{t.amountSource}</a>
  </details>}
 </div>;
}
