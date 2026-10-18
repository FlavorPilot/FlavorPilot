import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { count, desc, eq, gte, ilike, inArray, sql } from 'drizzle-orm';
import { ticketSchema, type AdminListQuery, type CreateTicket, type TicketMessageRequest, type TicketUpdate } from '@flavorpilot/contracts';
import { DatabaseService } from '../database/database.service';
import { adminAuditEvents, profiles, supportMessages, supportTickets } from '../database/schema';
import { allOf } from '../common/sql';
const serialize=(r:typeof supportTickets.$inferSelect)=>ticketSchema.parse({...r,createdAt:r.createdAt.toISOString(),updatedAt:r.updatedAt.toISOString()});
@Injectable()
export class SupportService {
    constructor(private readonly database:DatabaseService) {}
    async list(userId:string,q:AdminListQuery,staff=false) {
        return this.database.requireDatabase().transaction(async tx=>{
            const filter=allOf(ilike(supportTickets.subject,`%${q.search.replace(/[\\%_]/g,'\\$&')}%`),...(staff ? [] : [eq(supportTickets.ownerId,userId)]));
            const items=await tx.select().from(supportTickets).where(filter).orderBy(desc(supportTickets.updatedAt),desc(supportTickets.id)).limit(q.limit).offset((q.page-1)*q.limit);
            const [n]=await tx.select({n:count()}).from(supportTickets).where(filter);
            if(staff)await tx.insert(adminAuditEvents).values({actorId:userId,action:'support.list'});
            return {items:items.map(serialize),total:Number(n.n),page:q.page,limit:q.limit};
        });
    }
    async detail(userId:string,id:string,staff=false) {
        return this.database.requireDatabase().transaction(async tx=>{
            const [ticket]=await tx.select().from(supportTickets).where(allOf(eq(supportTickets.id,id),...(staff ? [] : [eq(supportTickets.ownerId,userId)]))).for('share');
            if(!ticket)throw new NotFoundException({code:'SUPPORT_NOT_FOUND'});
            const messages=await tx.select({id:supportMessages.id,ticketId:supportMessages.ticketId,text:supportMessages.text,
                fromStaff:supportMessages.fromStaff,createdAt:supportMessages.createdAt}).from(supportMessages)
                .where(eq(supportMessages.ticketId,id)).orderBy(supportMessages.createdAt,supportMessages.id).limit(100);
            if(staff)await tx.insert(adminAuditEvents).values({actorId:userId,action:'support.read',targetId:id});
            return {ticket:serialize(ticket),messages:messages.map(m=>({...m,createdAt:m.createdAt.toISOString()}))};
        });
    }
    async create(userId:string,input:CreateTicket) {
        const id=await this.database.requireDatabase().transaction(async tx=>{
            await tx.select({id:profiles.id}).from(profiles).where(eq(profiles.id,userId)).for('update');
            const [existing]=await tx.select().from(supportTickets).where(allOf(eq(supportTickets.ownerId,userId),eq(supportTickets.requestId,input.requestId))).limit(1);
            if(existing){
                const [message]=await tx.select({text:supportMessages.text}).from(supportMessages).where(allOf(eq(supportMessages.ticketId,existing.id),eq(supportMessages.requestId,input.requestId))).limit(1);
                if(existing.subject!==input.subject || existing.category!==input.category || message?.text!==input.text)throw new ConflictException({code:'REQUEST_ID_REUSED'});
                return existing.id;
            }
            const [open]=await tx.select({n:count()}).from(supportTickets).where(allOf(eq(supportTickets.ownerId,userId),inArray(supportTickets.status,['new','working','waiting_user','waiting_fix'])));
            const [daily]=await tx.select({n:count()}).from(supportTickets).where(allOf(eq(supportTickets.ownerId,userId),gte(supportTickets.createdAt,new Date(Date.now()-86400000))));
            if(Number(open.n)>=5 || Number(daily.n)>=10)throw new HttpException({code:'SUPPORT_LIMIT'},429);
            const [ticket]=await tx.insert(supportTickets).values({ownerId:userId,requestId:input.requestId,subject:input.subject,category:input.category}).returning();
            await tx.insert(supportMessages).values({ticketId:ticket.id,authorId:userId,requestId:input.requestId,text:input.text,fromStaff:false});
            return ticket.id;
        });
        return this.detail(userId,id);
    }
    async message(userId:string,id:string,input:TicketMessageRequest,staff=false) {
        await this.database.requireDatabase().transaction(async tx=>{
            const [ticket]=await tx.select().from(supportTickets).where(allOf(eq(supportTickets.id,id),...(staff ? [] : [eq(supportTickets.ownerId,userId)]))).for('update');
            if(!ticket)throw new NotFoundException({code:'SUPPORT_NOT_FOUND'});
            const [existing]=await tx.select().from(supportMessages).where(allOf(eq(supportMessages.ticketId,id),eq(supportMessages.authorId,userId),eq(supportMessages.requestId,input.requestId))).limit(1);
            if(existing){if(existing.text!==input.text || existing.fromStaff!==staff)throw new ConflictException({code:'REQUEST_ID_REUSED'});return;}
            if(['closed','resolved'].includes(ticket.status))throw new ConflictException({code:'SUPPORT_CLOSED'});
            const [messages]=await tx.select({n:count()}).from(supportMessages).where(eq(supportMessages.ticketId,id));
            if(Number(messages.n)>=100)throw new HttpException({code:'SUPPORT_LIMIT'},429);
            await tx.insert(supportMessages).values({ticketId:id,authorId:userId,requestId:input.requestId,text:input.text,fromStaff:staff});
            await tx.update(supportTickets).set({updatedAt:new Date(),revision:ticket.revision+1,status:staff ? 'waiting_user' : 'new'}).where(eq(supportTickets.id,id));
            if(staff)await tx.insert(adminAuditEvents).values({actorId:userId,action:'support.reply',targetId:id});
        });
        return this.detail(userId,id,staff);
    }
    async update(userId:string,id:string,input:TicketUpdate) {
        await this.database.requireDatabase().transaction(async tx=>{
            const [ticket]=await tx.select().from(supportTickets).where(eq(supportTickets.id,id)).for('update');
            if(!ticket)throw new NotFoundException({code:'SUPPORT_NOT_FOUND'});
            if(ticket.revision!==input.expectedRevision)throw new ConflictException({code:'ADMIN_STALE_RECORD'});
            await tx.update(supportTickets).set({status:input.status,priority:input.priority,assignedTo:input.assignedToSelf ? userId : null,
                revision:sql`${supportTickets.revision}+1`,updatedAt:new Date()}).where(eq(supportTickets.id,id));
            await tx.insert(adminAuditEvents).values({actorId:userId,action:'support.update',targetId:id,reason:input.reason});
        });
        return this.detail(userId,id,true);
    }
}
