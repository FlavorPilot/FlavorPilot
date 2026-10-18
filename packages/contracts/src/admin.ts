import { z } from 'zod';
import { modelFeedbackResponseSchema } from './feedback';

export const adminSections = ['overview','users','recipes','catalogue','feedback','support','audit','service'] as const;
export type AdminSection = typeof adminSections[number];
export const adminListQuerySchema = z.object({
    search: z.string().trim().max(100).default(''), page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
}).strict();
export type AdminListQuery = z.output<typeof adminListQuerySchema>;
const id = z.string().uuid(), date = z.string().datetime(), total = z.number().int().nonnegative();
const page = <T extends z.ZodType>(item:T) => z.object({items:z.array(item),total,page:total,limit:total});
export const adminAccessSchema = z.object({userId:id,role:z.literal('owner'),mfaRequired:z.boolean(),mfaVerified:z.boolean()});
export const adminOverviewSchema = z.object({users:total,recipes:total,publicRecipes:total,hiddenRecipes:total,
    sharedFeedback:total,unreviewedFeedback:total,openTickets:total,catalogue:total,modelVersion:z.string(),catalogueVersion:z.string(),checkedAt:date});
export const adminUserSchema = z.object({id,username:z.string(),displayName:z.string().nullable(),locale:z.string(),createdAt:date});
export const adminUserPageSchema = page(adminUserSchema);
export const adminRecipeSchema = z.object({id,ownerId:id,name:z.string(),ownerUsername:z.string().nullable(),
    moderationHidden:z.boolean(),moderationRevision:total,updatedAt:date,versionNumber:z.number().int().positive()});
export const adminRecipePageSchema = page(adminRecipeSchema);
export const adminUserDetailSchema = z.object({profile:adminUserSchema,recipeCount:total,publicRecipeCount:total,
    feedbackCount:total,ticketCount:total,subscription:z.object({tier:z.string(),status:z.string(),currentPeriodEnd:date.nullable()}).nullable(),
    publicRecipes:z.array(adminRecipeSchema)});
export const adminModerationRequestSchema = z.object({hidden:z.boolean(),reason:z.string().trim().min(5).max(500),expectedHidden:z.boolean(),expectedRevision:total}).strict();
export const feedbackReviewStatuses = ['new','reviewing','needs_check','closed'] as const;
export const feedbackReviewSchema = z.object({status:z.enum(feedbackReviewStatuses),note:z.string().max(2000),revision:total});
export const adminFeedbackSchema = modelFeedbackResponseSchema.extend({authorId:id,review:feedbackReviewSchema});
export const adminFeedbackPageSchema = page(adminFeedbackSchema);
export const adminReviewRequestSchema = z.object({status:z.enum(feedbackReviewStatuses),note:z.string().trim().max(2000),
    expectedRevision:total,expectedUpdatedAt:date}).strict();
const localized = z.object({en:z.string(),uk:z.string()});
export const adminCatalogueItemSchema = z.object({id:z.string(),name:localized,category:localized,
    preparations:z.array(z.object({id:z.string(),name:localized})),profile:z.record(z.string(),z.number()),
    share:z.object({min:z.number(),ideal:z.number(),max:z.number()}),reviewStatus:z.string(),
    source:z.object({url:z.string(),description:z.string(),fdcId:z.number()}).nullable(),
    nutrients:z.record(z.string(),z.number().nullable())});
export const adminCataloguePageSchema = page(adminCatalogueItemSchema);
export const adminAuditSchema = z.object({id,actorId:id.nullable(),action:z.string(),targetId:z.string().nullable(),
    reason:z.string().nullable(),createdAt:date});
export const adminAuditPageSchema = page(adminAuditSchema);
export const adminServiceSchema = z.object({database:z.enum(['connected','unavailable','not_configured']),checkedAt:date,
    environment:z.string(),apiVersion:z.string(),modelVersion:z.string(),catalogueVersion:z.string(),
    authConfigured:z.boolean(),aiEnabled:z.boolean(),billing:z.literal('not_connected'),backups:z.literal('not_monitored')});

export type AdminAccess = z.infer<typeof adminAccessSchema>;
export type AdminOverview = z.infer<typeof adminOverviewSchema>;
export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;
export type AdminUserPage = z.infer<typeof adminUserPageSchema>;
export type AdminRecipePage = z.infer<typeof adminRecipePageSchema>;
export type AdminCataloguePage = z.infer<typeof adminCataloguePageSchema>;
export type AdminFeedbackPage = z.infer<typeof adminFeedbackPageSchema>;
export type AdminAuditPage = z.infer<typeof adminAuditPageSchema>;
export type AdminService = z.infer<typeof adminServiceSchema>;
export type AdminModerationRequest = z.infer<typeof adminModerationRequestSchema>;
export type AdminReviewRequest = z.infer<typeof adminReviewRequestSchema>;
