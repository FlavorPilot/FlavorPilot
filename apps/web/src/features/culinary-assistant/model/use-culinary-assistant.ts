'use client';
import { useEffect,useRef,useState } from 'react';
import type { AiCapabilities,AiComment,AiExplainResponse,AiRecipe,AiDishOutcome,AiGeneratedRecipe } from '@flavorpilot/contracts';
import { aiRepository } from '@/entities/ai';
import { ApiError } from '@/shared/api';
import type { Locale } from '@/shared/i18n';
type Kind='explain'|'step'|'full'|'generate';
type Result={snapshot:string;kind:Kind;comments:AiComment[];explanation?:AiExplainResponse};
export function useCulinaryAssistant(input:{recipe:AiRecipe;locale:Locale;token?:string;dishId?:string;active:boolean;onApply:(id:string,text:string)=>void;onApplyRecipe:(recipe:AiGeneratedRecipe)=>void}){
 const {recipe,locale,token,dishId,active}=input;
 const [generationBrief,setGenerationBrief]=useState('');
 const snapshot=JSON.stringify({recipe,locale,dishId,generationBrief});
 const [quota,setQuota]=useState<AiCapabilities|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [consent,setConsent]=useState(false),[automatic,setAutomatic]=useState(false),[activeStep,setActiveStep]=useState('');
 const [editEpoch,setEditEpoch]=useState(0),previousEdit=useRef(0);
 const [result,setResult]=useState<Result|null>(null),[dismissed,setDismissed]=useState<string[]>([]);
 const [assessment,setAssessment]=useState<{snapshot:string;value:AiDishOutcome}|null>(null);
 const [generation,setGeneration]=useState<{snapshot:string;recipe:AiGeneratedRecipe;assumptions:string[]}|null>(null);
 const latest=useRef(snapshot),controller=useRef<AbortController|null>(null),lastAuto=useRef(0),ids=useRef(new Map<string,string>()),mounted=useRef(true);
 latest.current=snapshot;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();};},[]);
 useEffect(()=>{controller.current?.abort();setBusy(false);setError('');},[snapshot]);
 useEffect(()=>{setQuota(null);const c=new AbortController();void aiRepository.capabilities(token,c.signal).then(setQuota).catch(e=>{if(!c.signal.aborted)setError(e instanceof ApiError?e.code:'AI_PROVIDER_UNAVAILABLE');});return()=>c.abort();},[token]);
 const available=Boolean(quota?.enabled&&quota.access!=='none');
 async function run(kind:Kind){
  if(!available||!consent||busy||!recipe.items.length)return;
  const step=recipe.steps.find(s=>s.id===activeStep&&s.text.trim());
  if(kind==='step'&&!step)return;
  const key=latest.current,idKey=`${kind}:${activeStep}:${key}`;
  let requestId=ids.current.get(idKey);if(!requestId){requestId=crypto.randomUUID();ids.current.set(idKey,requestId);if(ids.current.size>20)ids.current.delete(ids.current.keys().next().value!);}
  controller.current?.abort();const c=new AbortController();controller.current=c;setBusy(true);setError('');lastAuto.current=Date.now();
  try{
   if(kind==='explain'){
    const explanation=await aiRepository.explain({requestId,locale,dishName:recipe.name,items:recipe.items,goal:recipe.goal,includeRecommendations:true},token,c.signal);
    if(mounted.current&&latest.current===key&&!c.signal.aborted){setResult({snapshot:key,kind,comments:[],explanation});setDismissed([]);}
   }else if(kind==='generate'){
    const value=await aiRepository.generate({requestId,locale,...(token&&dishId?{dishId}:{}),recipe,brief:generationBrief},token,c.signal);
    if(mounted.current&&latest.current===key&&!c.signal.aborted){setGeneration({snapshot:key,recipe:value.recipe,assumptions:value.assumptions});setQuota(value.quota);}
   }else{
    const value=await aiRepository.review({requestId,locale,scope:kind,...(kind==='full'?{includeOutcome:true}:{activeStepId:activeStep}),...(token&&dishId?{dishId}:{}),recipe},token,c.signal);
    if(mounted.current&&latest.current===key&&!c.signal.aborted){setResult({snapshot:key,kind,comments:value.comments});setDismissed([]);setQuota(value.quota);if(value.outcome)setAssessment({snapshot:key,value:value.outcome});}
   }
  }catch(e){
   if(e instanceof ApiError&&['AI_RESPONSE_INVALID','AI_RESPONSE_INCOMPLETE','AI_INPUT_TOO_LARGE','AI_QUOTA_EXCEEDED','AI_RATE_LIMITED','AI_BUDGET_EXCEEDED','AI_PLAN_REQUIRED','AI_DISABLED'].includes(e.code))ids.current.delete(idKey);
   if(mounted.current&&latest.current===key&&!c.signal.aborted)setError(e instanceof ApiError?e.code:'AI_PROVIDER_UNAVAILABLE');
  }
  finally{if(mounted.current&&controller.current===c){setBusy(false);if(!c.signal.aborted)void aiRepository.capabilities(token).then(q=>{if(mounted.current)setQuota(q);}).catch(()=>{});}}
 }
 const runRef=useRef(run);runRef.current=run;
 useEffect(()=>{
  const changed=previousEdit.current!==editEpoch;previousEdit.current=editEpoch;
  if(!changed||!active||!automatic||!consent||!available)return;
  const timer=setTimeout(()=>{void runRef.current('step');},Math.max(5000,20000-(Date.now()-lastAuto.current)));
  return()=>clearTimeout(timer);
 },[snapshot,editEpoch,active,automatic,consent,available]);
 function apply(comment:AiComment){if(result?.snapshot!==latest.current||!comment.stepId||!comment.suggestedText)return;input.onApply(comment.stepId,comment.suggestedText);}
 return {signedIn:Boolean(token),quota,busy,error,consent,automatic,available,activeStep,setActiveStep,editedStep:(id:string)=>{setActiveStep(id);setEditEpoch(v=>v+1);},result,stale:Boolean(result&&result.snapshot!==snapshot),
  assessment:assessment?.value??null,assessmentStale:Boolean(assessment&&assessment.snapshot!==snapshot),
  generation,generationStale:Boolean(generation&&generation.snapshot!==snapshot),generationBrief,setGenerationBrief,
  applyRecipe:()=>{if(generation&&generation.snapshot===latest.current&&!busy){input.onApplyRecipe(generation.recipe);setGeneration(null);setAutomatic(false);}},
  comments:result?.comments.filter(c=>!dismissed.includes(c.id))??[],run,apply,dismiss:(id:string)=>setDismissed(v=>[...v,id]),
  setConsent:(v:boolean)=>{setConsent(v);if(!v){setAutomatic(false);controller.current?.abort();setBusy(false);}},
  setAutomatic:(v:boolean)=>{setAutomatic(v);if(!v){controller.current?.abort();setBusy(false);}},
 };
}
