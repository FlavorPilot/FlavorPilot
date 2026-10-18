// Runs through the authenticated application API and its ordinary quota/budget controls.
// Default is dry-run. Synthetic cases only; no private recipe corpus or API key is read.
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
const cases=JSON.parse(fs.readFileSync(new URL('../tests/evals/culinary-review.json',import.meta.url),'utf8'));
const limit=Math.min(6,Math.max(1,Number(process.env.FLAVORPILOT_EVAL_LIMIT??3)));
if(!Number.isInteger(limit))throw Error('Invalid eval limit');
if(!process.argv.includes('--apply')){console.log(JSON.stringify({dryRun:true,cases:cases.slice(0,limit).map(c=>c.id),maxCheckUnits:limit*4,maxProviderUsd:limit*3200/1e6}));process.exit(0);}
const token=process.env.FLAVORPILOT_EVAL_ACCESS_TOKEN,base=process.env.FLAVORPILOT_EVAL_API_URL;
if(!token||!base)throw Error('Set FLAVORPILOT_EVAL_ACCESS_TOKEN and FLAVORPILOT_EVAL_API_URL');
const url=new URL(base);
if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw Error('HTTPS required');
const results=[];
for(const c of cases.slice(0,limit)){
 const {id,locale,review,steps,...recipe}=c;
 const response=await fetch(`${base.replace(/\/$/,'')}/ai/review-recipe`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({requestId:randomUUID(),locale,scope:'full',recipe:{...recipe,description:'',servings:null,steps:steps.map(text=>({id:randomUUID(),text}))}}),signal:AbortSignal.timeout(70000)});
 const data=await response.json();results.push({id,status:response.status,review,result:data,expertVerdict:null});
 if(!response.ok)break;
}
fs.mkdirSync('.local',{recursive:true});fs.writeFileSync('.local/ai-evaluation.json',JSON.stringify({model:'gpt-6-luna',results},null,2));
console.log(JSON.stringify({completed:results.length,report:'.local/ai-evaluation.json',expertReviewRequired:true}));
