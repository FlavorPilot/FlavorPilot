import { z } from 'zod';
import { dishAnalysisSchema, dishGoalSchema, dishItemSchema } from './flavor';
import { recipeContentSchema } from './recipe';
import { dishOwnerSchema } from './dishes';

export const feedbackAgreements = ['matches', 'partial', 'missed'] as const;
export const feedbackConcerns = ['compatibility', 'balance', 'quantity', 'texture'] as const;
export const feedbackRecipeSchema = recipeContentSchema.extend({
    name: z.string().max(160), goal: dishGoalSchema, items: z.array(dishItemSchema.strict()).min(2).max(24),
}).strict();
export type FeedbackRecipeSnapshot = z.infer<typeof feedbackRecipeSchema>;
export const modelFeedbackRequestSchema = z.object({
    recipe: feedbackRecipeSchema, dishId: z.string().uuid().optional(), dishVersionNumber: z.number().int().positive().optional(),
    modelVersion: z.string().min(1).max(80), catalogueVersion: z.string().min(1).max(80),
    cooked: z.boolean(), agreement: z.enum(feedbackAgreements),
    concerns: z.array(z.enum(feedbackConcerns)).max(4).default([]).refine(values => new Set(values).size === values.length),
    note: z.string().trim().max(2000).default(''),
}).strict().refine(value => value.agreement !== 'matches' || value.concerns.length === 0, { message: 'Matching feedback cannot include discrepancies' })
    .refine(value => value.dishVersionNumber === undefined || value.dishId !== undefined, { message: 'A recipe version requires a recipe ID' });
export type ModelFeedbackRequest = z.input<typeof modelFeedbackRequestSchema>;
export type NormalizedModelFeedbackRequest = z.output<typeof modelFeedbackRequestSchema>;
export const modelFeedbackResponseSchema = z.object({
    id: z.string().uuid(), dishId: z.string().uuid().nullable(), dishVersionNumber: z.number().int().positive().nullable(),
    recipe: feedbackRecipeSchema, analysis: dishAnalysisSchema,
    modelVersion: z.string(), catalogueVersion: z.string(), cooked: z.boolean(), agreement: z.enum(feedbackAgreements),
    concerns: z.array(z.enum(feedbackConcerns)), note: z.string(), createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
});
export type ModelFeedbackResponse = z.infer<typeof modelFeedbackResponseSchema>;

export const createCommentRequestSchema = z.object({
    text: z.string().trim().min(1).max(2000), hasCooked: z.boolean().default(false),
    parentId: z.string().uuid().optional(), versionNumber: z.number().int().positive(),
}).strict();
export type CreateCommentRequest = z.input<typeof createCommentRequestSchema>;
export type NormalizedCreateCommentRequest = z.output<typeof createCommentRequestSchema>;
export const commentResponseSchema = z.object({
    id: z.string().uuid(), parentId: z.string().uuid().nullable(), text: z.string().nullable(),
    hasCooked: z.boolean(), versionNumber: z.number().int().positive(), author: dishOwnerSchema.nullable(),
    replyTo: z.object({ authorName: z.string(), text: z.string().nullable() }).nullable(),
    createdAt: z.string().datetime(), deleted: z.boolean(),
});
export type CommentResponse = z.infer<typeof commentResponseSchema>;
export const commentListQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().max(100).regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\|[0-9a-f-]{36}$/i)
        .refine(value => z.string().datetime().safeParse(value.split('|')[0]).success && z.string().uuid().safeParse(value.split('|')[1]).success).optional(),
});
export type CommentListQuery = z.output<typeof commentListQuerySchema>;
export const commentListResponseSchema = z.object({
    items: z.array(commentResponseSchema), nextCursor: z.string().nullable(), versionNumber: z.number().int().positive(),
});
export type CommentListResponse = z.infer<typeof commentListResponseSchema>;
