import { z } from 'zod';
import { adminAccessSchema,adminOverviewSchema,adminUserPageSchema,adminUserDetailSchema,adminRecipePageSchema,
    adminCataloguePageSchema,adminFeedbackPageSchema,adminAuditPageSchema,adminServiceSchema,
    adminModerationRequestSchema,adminReviewRequestSchema,type AdminModerationRequest,type AdminReviewRequest } from '@flavorpilot/contracts';
import { request } from '@/shared/api';
const ok=z.object({ok:z.literal(true)});
export const adminRepository={
    access:(token:string,signal?:AbortSignal)=>request('/admin/access',v=>adminAccessSchema.parse(v),{token,signal}),
    overview:(token:string,signal?:AbortSignal)=>request('/admin/overview',v=>adminOverviewSchema.parse(v),{token,signal}),
    users:(query:string,token:string,signal?:AbortSignal)=>request(`/admin/users?${query}`,v=>adminUserPageSchema.parse(v),{token,signal}),
    user:(id:string,token:string,signal?:AbortSignal)=>request(`/admin/users/${encodeURIComponent(id)}`,v=>adminUserDetailSchema.parse(v),{token,signal}),
    recipes:(query:string,token:string,signal?:AbortSignal)=>request(`/admin/recipes?${query}`,v=>adminRecipePageSchema.parse(v),{token,signal}),
    catalogue:(query:string,token:string,signal?:AbortSignal)=>request(`/admin/catalogue?${query}`,v=>adminCataloguePageSchema.parse(v),{token,signal}),
    feedback:(query:string,token:string,signal?:AbortSignal)=>request(`/admin/feedback?${query}`,v=>adminFeedbackPageSchema.parse(v),{token,signal}),
    audit:(query:string,token:string,signal?:AbortSignal)=>request(`/admin/audit?${query}`,v=>adminAuditPageSchema.parse(v),{token,signal}),
    service:(token:string,signal?:AbortSignal)=>request('/admin/service',v=>adminServiceSchema.parse(v),{token,signal}),
    moderate:(id:string,body:AdminModerationRequest,token:string)=>request(`/admin/recipes/${encodeURIComponent(id)}/moderation`,v=>ok.parse(v),{token,method:'PATCH',body:adminModerationRequestSchema.parse(body)}),
    review:(id:string,body:AdminReviewRequest,token:string)=>request(`/admin/feedback/${encodeURIComponent(id)}/review`,v=>ok.parse(v),{token,method:'PATCH',body:adminReviewRequestSchema.parse(body)}),
};
