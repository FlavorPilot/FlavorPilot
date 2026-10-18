import { z } from 'zod';
export const ticketCategories = ['account','recipe','model','billing','other'] as const;
export const ticketStatuses = ['new','working','waiting_user','waiting_fix','resolved','closed'] as const;
export const ticketPriorities = ['normal','high'] as const;
export const createTicketSchema = z.object({subject:z.string().trim().min(3).max(160),
    category:z.enum(ticketCategories),text:z.string().trim().min(5).max(4000),requestId:z.string().uuid()}).strict();
export const ticketMessageRequestSchema = z.object({text:z.string().trim().min(1).max(4000),requestId:z.string().uuid()}).strict();
export const ticketUpdateSchema = z.object({status:z.enum(ticketStatuses),priority:z.enum(ticketPriorities),
    assignedToSelf:z.boolean(),reason:z.string().trim().min(5).max(500),expectedRevision:z.number().int().nonnegative()}).strict();
export const ticketSchema = z.object({id:z.string().uuid(),ownerId:z.string().uuid(),subject:z.string(),
    category:z.enum(ticketCategories),status:z.enum(ticketStatuses),priority:z.enum(ticketPriorities),
    assignedTo:z.string().uuid().nullable(),revision:z.number().int().nonnegative(),createdAt:z.string().datetime(),updatedAt:z.string().datetime()});
export const ticketMessageSchema = z.object({id:z.string().uuid(),ticketId:z.string().uuid(),text:z.string(),
    fromStaff:z.boolean(),createdAt:z.string().datetime()});
export const ticketDetailSchema = z.object({ticket:ticketSchema,messages:z.array(ticketMessageSchema)});
export const ticketPageSchema = z.object({items:z.array(ticketSchema),total:z.number().int().nonnegative(),page:z.number(),limit:z.number()});
export type CreateTicket = z.infer<typeof createTicketSchema>;
export type TicketMessageRequest = z.infer<typeof ticketMessageRequestSchema>;
export type TicketUpdate = z.infer<typeof ticketUpdateSchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type TicketDetail = z.infer<typeof ticketDetailSchema>;
export type TicketPage = z.infer<typeof ticketPageSchema>;
