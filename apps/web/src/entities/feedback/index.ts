import { modelFeedbackRequestSchema, modelFeedbackResponseSchema, type ModelFeedbackRequest } from '@flavorpilot/contracts';
import { request } from '@/shared/api';
export const feedbackRepository = {
    save: (input: ModelFeedbackRequest, token: string) => request('/feedback', value => modelFeedbackResponseSchema.parse(value), {method:'POST',token,body:modelFeedbackRequestSchema.parse(input)}),
    get: (id: string, token: string) => request(`/feedback/${encodeURIComponent(id)}`, value => modelFeedbackResponseSchema.parse(value), {token}),
};
