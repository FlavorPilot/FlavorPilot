import { aiCapabilitiesSchema,aiReviewResponseSchema,aiExplainResponseSchema,type AiReviewRequest,type AiExplainRequest } from '@flavorpilot/contracts';
import { request } from '@/shared/api';
export const aiRepository={
 capabilities:(token:string,signal?:AbortSignal)=>request('/account/capabilities',v=>aiCapabilitiesSchema.parse(v),{token,signal}),
 review:(body:AiReviewRequest,token:string,signal?:AbortSignal)=>request('/ai/review-recipe',v=>aiReviewResponseSchema.parse(v),{method:'POST',body,token,signal,timeoutMs:70000}),
 explain:(body:AiExplainRequest,token:string,signal?:AbortSignal)=>request('/ai/explain',v=>aiExplainResponseSchema.parse(v),{method:'POST',body,token,signal,timeoutMs:70000}),
};
