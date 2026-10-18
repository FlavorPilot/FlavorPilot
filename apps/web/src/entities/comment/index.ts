import { commentListResponseSchema, commentResponseSchema, createCommentRequestSchema, type CreateCommentRequest } from '@flavorpilot/contracts';
import { request } from '@/shared/api';
const path = (id: string) => `/dishes/${encodeURIComponent(id)}/comments`;
export const commentRepository = {
    list: (id: string, cursor?: string, signal?: AbortSignal) => request(`${path(id)}?${new URLSearchParams({limit:'20',...(cursor ? {cursor} : {})})}`, value => commentListResponseSchema.parse(value), {signal}),
    create: (id: string, input: CreateCommentRequest, token: string) => request(path(id), value => commentResponseSchema.parse(value), {method:'POST',token,body:createCommentRequestSchema.parse(input)}),
    remove: (id: string, commentId: string, token: string) => request(`${path(id)}/${encodeURIComponent(commentId)}`, () => undefined, {method:'DELETE',token}),
};
