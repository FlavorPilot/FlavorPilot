import { aiCapabilitiesSchema,aiGuestSessionSchema,aiReviewResponseSchema,aiExplainResponseSchema,aiGenerateResponseSchema,type AiGenerateRequest,type AiReviewRequest,type AiExplainRequest } from '@flavorpilot/contracts';
import { ApiError,request } from '@/shared/api';
const guestKey='flavorpilot.ai-guest.v1';
function guestToken():string|undefined {
 try {const value=localStorage.getItem(guestKey);if(value!==null&&!/^[a-f0-9]{64}$/.test(value))throw new Error();return value??undefined;}
 catch {throw new ApiError(503,'AI_GUEST_STORAGE_UNAVAILABLE');}
}
async function identity(token?:string,signal?:AbortSignal,create=false){
 if(token)return {token};
 let guest=guestToken();
 if(!guest&&create){
  const session=await request('/ai/guest-session',v=>aiGuestSessionSchema.parse(v),{method:'POST',signal});
  guest=session.token;
  try{localStorage.setItem(guestKey,guest);}catch{throw new ApiError(503,'AI_GUEST_STORAGE_UNAVAILABLE');}
 }
 return {headers:guest?{'X-AI-Guest-Token':guest}:undefined};
}
export const aiRepository={
 capabilities:async(token?:string,signal?:AbortSignal)=>request(token?'/account/capabilities':'/ai/capabilities',v=>aiCapabilitiesSchema.parse(v),{...await identity(token,signal),signal}),
 review:async(body:AiReviewRequest,token?:string,signal?:AbortSignal)=>request('/ai/review-recipe',v=>aiReviewResponseSchema.parse(v),{method:'POST',body,...await identity(token,signal,true),signal,timeoutMs:70000}),
 explain:async(body:AiExplainRequest,token?:string,signal?:AbortSignal)=>request('/ai/explain',v=>aiExplainResponseSchema.parse(v),{method:'POST',body,...await identity(token,signal,true),signal,timeoutMs:70000}),
 generate:async(body:AiGenerateRequest,token?:string,signal?:AbortSignal)=>request('/ai/generate-recipe',v=>aiGenerateResponseSchema.parse(v),{method:'POST',body,...await identity(token,signal,true),signal,timeoutMs:70000}),
};
