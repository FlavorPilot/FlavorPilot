import { modelFeedbackRequestSchema, modelFeedbackResponseSchema, ownFeedbackPageSchema, type ModelFeedbackRequest } from '@flavorpilot/contracts';
import { request } from '@/shared/api';
export const feedbackRepository = {
    save: (input: ModelFeedbackRequest, token: string) => request('/feedback', value => modelFeedbackResponseSchema.parse(value), {method:'POST',token,body:modelFeedbackRequestSchema.parse(input)}),
    get: (id: string, token: string) => request(`/feedback/${encodeURIComponent(id)}`, value => modelFeedbackResponseSchema.parse(value), {token}),
    mine:(page:number,token:string,signal?:AbortSignal)=>request(`/feedback/mine?page=${page}&limit=10`,v=>ownFeedbackPageSchema.parse(v),{token,signal}),
    withdraw:(id:string,token:string)=>request(`/feedback/${encodeURIComponent(id)}/permission`,()=>undefined,{token,method:'PATCH',body:{allowTeamReview:false}}),
};
