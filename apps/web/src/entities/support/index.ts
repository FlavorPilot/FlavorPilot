import { createTicketSchema,ticketMessageRequestSchema,ticketUpdateSchema,ticketDetailSchema,ticketPageSchema,
    type CreateTicket,type TicketMessageRequest,type TicketUpdate } from '@flavorpilot/contracts';
import { request } from '@/shared/api';
const path=(staff:boolean)=>staff ? '/admin/support' : '/support';
export const supportRepository={
    list:(query:string,token:string,staff=false,signal?:AbortSignal)=>request(`${path(staff)}?${query}`,v=>ticketPageSchema.parse(v),{token,signal}),
    detail:(id:string,token:string,staff=false,signal?:AbortSignal)=>request(`${path(staff)}/${encodeURIComponent(id)}`,v=>ticketDetailSchema.parse(v),{token,signal}),
    create:(body:CreateTicket,token:string)=>request('/support',v=>ticketDetailSchema.parse(v),{token,method:'POST',body:createTicketSchema.parse(body)}),
    message:(id:string,body:TicketMessageRequest,token:string,staff=false)=>request(`${path(staff)}/${encodeURIComponent(id)}/messages`,v=>ticketDetailSchema.parse(v),{token,method:'POST',body:ticketMessageRequestSchema.parse(body)}),
    update:(id:string,body:TicketUpdate,token:string)=>request(`/admin/support/${encodeURIComponent(id)}`,v=>ticketDetailSchema.parse(v),{token,method:'PATCH',body:ticketUpdateSchema.parse(body)}),
};
