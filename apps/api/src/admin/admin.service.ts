import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiUsageService } from '../ai/ai-usage.service';
import { count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import type { AdminListQuery, AdminModerationRequest, AdminReviewRequest } from '@flavorpilot/contracts';
import { ingredients, ingredientKnowledge, aiIngredientKnowledge, sourcedIdentities, nutrientHypotheses,
    preparationById, MODEL_VERSION, CATALOGUE_VERSION } from '@flavorpilot/flavor-engine';
import { DatabaseService } from '../database/database.service';
import { adminAuditEvents, adminMemberships, dishes, feedbackReviews, modelFeedback, profiles, subscriptions, supportTickets } from '../database/schema';
import { allOf } from '../common/sql';
const pattern=(search:string)=>`%${search.replace(/[\\%_]/g,'\\$&')}%`;
const paging=(q:AdminListQuery)=>({page:q.page,limit:q.limit});
const recipeFields={id:dishes.id,ownerId:dishes.ownerId,name:dishes.name,ownerUsername:profiles.username,moderationHidden:dishes.moderationHidden,moderationRevision:dishes.moderationRevision,
    updatedAt:dishes.updatedAt,versionNumber:sql<number>`(select coalesce(max(v.version_number),1)::int from public.dish_versions v where v.dish_id=${dishes.id})`};
const userFields={id:profiles.id,username:profiles.username,displayName:profiles.displayName,locale:profiles.locale,createdAt:profiles.createdAt};
const reviewDefault={status:'new' as const,note:'',revision:0};
@Injectable()
export class AdminService {
    constructor(private readonly database:DatabaseService,private readonly config:ConfigService,private readonly aiUsage:AiUsageService) {}
    async log(actorId:string,action:string,targetId?:string,reason?:string) {
        await this.database.requireDatabase().insert(adminAuditEvents).values({actorId,action,targetId,reason});
    }
    async overview(actorId:string) {
        const [row]=await this.database.requireDatabase().select({
            users:sql<number>`(select count(*)::int from public.profiles where true)`,
            recipes:sql<number>`(select count(*)::int from public.dishes where true)`,
            publicRecipes:sql<number>`(select count(*)::int from public.dishes where visibility='public' and not moderation_hidden)`,
            hiddenRecipes:sql<number>`(select count(*)::int from public.dishes where moderation_hidden)`,
            sharedFeedback:sql<number>`(select count(*)::int from public.model_feedback where allow_team_review)`,
            unreviewedFeedback:sql<number>`(select count(*)::int from public.model_feedback f left join public.feedback_reviews r on r.feedback_id=f.id where f.allow_team_review and (r.status is null or r.status='new'))`,
            openTickets:sql<number>`(select count(*)::int from public.support_tickets where status not in ('resolved','closed'))`,
        }).from(adminMemberships).where(eq(adminMemberships.userId,actorId)).limit(1);
        await this.log(actorId,'overview.read');
        return {...row,catalogue:ingredients.length,modelVersion:MODEL_VERSION,catalogueVersion:CATALOGUE_VERSION,checkedAt:new Date().toISOString()};
    }
    async users(actorId:string,q:AdminListQuery) {
        const db=this.database.requireDatabase(),filter=or(ilike(profiles.username,pattern(q.search)),ilike(profiles.displayName,pattern(q.search)),sql`${profiles.id}::text ilike ${pattern(q.search)}`)!;
        const [items,[n]]=await Promise.all([
            db.select(userFields).from(profiles).where(filter).orderBy(desc(profiles.createdAt),desc(profiles.id)).limit(q.limit).offset((q.page-1)*q.limit),
            db.select({n:count()}).from(profiles).where(filter),
        ]);
        await this.log(actorId,'users.list');
        return {items:items.map(p=>({...p,createdAt:p.createdAt.toISOString()})),total:Number(n.n),...paging(q)};
    }
    async user(actorId:string,id:string) {
        const db=this.database.requireDatabase();
        const [profile]=await db.select(userFields).from(profiles).where(eq(profiles.id,id)).limit(1);
        if(!profile)throw new NotFoundException({code:'ADMIN_RECORD_NOT_FOUND'});
        const [[counts],[feedback],[tickets],[subscription],publicRecipes]=await Promise.all([
            db.select({all:count(),public:sql<number>`count(*) filter(where ${dishes.visibility}='public')::int`}).from(dishes).where(eq(dishes.ownerId,id)),
            db.select({n:count()}).from(modelFeedback).where(allOf(eq(modelFeedback.authorId,id),eq(modelFeedback.allowTeamReview,true))),
            db.select({n:count()}).from(supportTickets).where(eq(supportTickets.ownerId,id)),
            db.select({tier:subscriptions.tier,status:subscriptions.status,currentPeriodEnd:subscriptions.currentPeriodEnd}).from(subscriptions).where(eq(subscriptions.userId,id)),
            db.select(recipeFields).from(dishes).leftJoin(profiles,eq(profiles.id,dishes.ownerId)).where(allOf(eq(dishes.ownerId,id),eq(dishes.visibility,'public'))).orderBy(desc(dishes.updatedAt),desc(dishes.id)).limit(20),
        ]);
        await this.log(actorId,'user.read',id);
        return {profile:{...profile,createdAt:profile.createdAt.toISOString()},recipeCount:Number(counts.all),publicRecipeCount:Number(counts.public),
            feedbackCount:Number(feedback.n),ticketCount:Number(tickets.n),subscription:subscription ? {...subscription,currentPeriodEnd:subscription.currentPeriodEnd?.toISOString() ?? null} : null,
            publicRecipes:publicRecipes.map(r=>({...r,updatedAt:r.updatedAt.toISOString()}))};
    }
    async recipes(actorId:string,q:AdminListQuery) {
        const db=this.database.requireDatabase(),filter=allOf(eq(dishes.visibility,'public'),ilike(dishes.name,pattern(q.search)));
        const [rows,[n]]=await Promise.all([
            db.select(recipeFields).from(dishes).leftJoin(profiles,eq(profiles.id,dishes.ownerId)).where(filter)
                .orderBy(desc(dishes.updatedAt),desc(dishes.id)).limit(q.limit).offset((q.page-1)*q.limit),
            db.select({n:count()}).from(dishes).where(filter),
        ]);
        await this.log(actorId,'recipes.list');
        return {items:rows.map(r=>({...r,updatedAt:r.updatedAt.toISOString()})),total:Number(n.n),...paging(q)};
    }
    async moderate(actorId:string,id:string,input:AdminModerationRequest) {
        await this.database.requireDatabase().transaction(async tx=>{
            const [dish]=await tx.select({hidden:dishes.moderationHidden,revision:dishes.moderationRevision}).from(dishes).where(allOf(eq(dishes.id,id),eq(dishes.visibility,'public'))).for('update');
            if(!dish)throw new NotFoundException({code:'ADMIN_RECORD_NOT_FOUND'});
            if(dish.hidden!==input.expectedHidden || dish.revision!==input.expectedRevision)throw new ConflictException({code:'ADMIN_STALE_RECORD'});
            await tx.update(dishes).set({moderationHidden:input.hidden,moderationRevision:dish.revision+1}).where(eq(dishes.id,id));
            await tx.insert(adminAuditEvents).values({actorId,action:input.hidden ? 'recipe.hide' : 'recipe.restore',targetId:id,reason:input.reason});
        });
        return {ok:true};
    }
    async feedback(actorId:string,q:AdminListQuery) {
        return this.database.requireDatabase().transaction(async tx=>{
            const filter=allOf(eq(modelFeedback.allowTeamReview,true),or(ilike(modelFeedback.agreement,pattern(q.search)),sql`${modelFeedback.recipeSnapshot}->>'name' ilike ${pattern(q.search)}`)!);
            const rows=await tx.select({feedback:modelFeedback,review:feedbackReviews}).from(modelFeedback)
                .leftJoin(feedbackReviews,eq(feedbackReviews.feedbackId,modelFeedback.id)).where(filter)
                .orderBy(desc(modelFeedback.createdAt),desc(modelFeedback.id)).limit(q.limit).offset((q.page-1)*q.limit).for('share',{of:modelFeedback});
            const [n]=await tx.select({n:count()}).from(modelFeedback).where(filter);
            await tx.insert(adminAuditEvents).values({actorId,action:'feedback.list'});
            return {items:rows.map(({feedback:f,review:r})=>({id:f.id,authorId:f.authorId,dishId:f.dishId,dishVersionNumber:f.dishVersionNumber,
                recipe:f.recipeSnapshot,analysis:f.analysisSnapshot,modelVersion:f.modelVersion,catalogueVersion:f.catalogueVersion,
                cooked:f.cooked,agreement:f.agreement,concerns:f.concerns,note:f.note,allowTeamReview:f.allowTeamReview,
                createdAt:f.createdAt.toISOString(),updatedAt:f.updatedAt.toISOString(),review:r ? {status:r.status,note:r.note,revision:r.revision} : reviewDefault})),
                total:Number(n.n),...paging(q)};
        });
    }
    async review(actorId:string,id:string,input:AdminReviewRequest) {
        await this.database.requireDatabase().transaction(async tx=>{
            const [f]=await tx.select({updatedAt:modelFeedback.updatedAt}).from(modelFeedback).where(allOf(eq(modelFeedback.id,id),eq(modelFeedback.allowTeamReview,true))).for('update');
            if(!f)throw new NotFoundException({code:'ADMIN_RECORD_NOT_FOUND'});
            const [r]=await tx.select().from(feedbackReviews).where(eq(feedbackReviews.feedbackId,id)).limit(1);
            if((r?.revision ?? 0)!==input.expectedRevision || f.updatedAt.toISOString()!==input.expectedUpdatedAt)
                throw new ConflictException({code:'ADMIN_STALE_RECORD'});
            await tx.insert(feedbackReviews).values({feedbackId:id,status:input.status,note:input.note,revision:1,updatedBy:actorId})
                .onConflictDoUpdate({target:feedbackReviews.feedbackId,set:{status:input.status,note:input.note,revision:input.expectedRevision+1,updatedBy:actorId,updatedAt:new Date()}});
            await tx.insert(adminAuditEvents).values({actorId,action:'feedback.review',targetId:id});
        });
        return {ok:true};
    }
    async catalogue(actorId:string,q:AdminListQuery) {
        const term=q.search.toLocaleLowerCase();
        const found=ingredients.filter(i=>`${i.id} ${i.name.en} ${i.name.uk}`.toLocaleLowerCase().includes(term));
        const items=found.slice((q.page-1)*q.limit,q.page*q.limit).map(i=>{
            const source=sourcedIdentities.find(s=>s.catalogIngredientId===i.id || s.id===i.id);
            const n=source ? nutrientHypotheses.find(n=>n.identityId===source.id) : undefined;
            return {id:i.id,name:i.name,category:i.category,profile:i.profile,share:i.share,
                preparations:i.preparations.flatMap(id=>{const p=preparationById.get(id);return p ? [{id,name:p.name}] : [];}),
                reviewStatus:(aiIngredientKnowledge.get(i.id) ?? ingredientKnowledge.get(i.id))?.reviewStatus ?? 'unreviewed',
                source:source ? {url:source.sourceUrl,description:source.fdcDescription,fdcId:source.fdcId} : null,
                nutrients:{protein:n?.proteinG ?? null,fat:n?.fatG ?? null,carbohydrate:n?.carbohydrateG ?? null,sugars:n?.sugarsG ?? null,sodium:n?.sodiumMg ?? null,energy:n?.energyKcal ?? null}};
        });
        await this.log(actorId,'catalogue.list');
        return {items,total:found.length,...paging(q)};
    }
    async audit(actorId:string,q:AdminListQuery) {
        const db=this.database.requireDatabase(),filter=ilike(adminAuditEvents.action,pattern(q.search));
        const [items,[n]]=await Promise.all([
            db.select().from(adminAuditEvents).where(filter).orderBy(desc(adminAuditEvents.createdAt),desc(adminAuditEvents.id)).limit(q.limit).offset((q.page-1)*q.limit),
            db.select({n:count()}).from(adminAuditEvents).where(filter),
        ]);
        await this.log(actorId,'audit.list');
        return {items:items.map(r=>({...r,createdAt:r.createdAt.toISOString()})),total:Number(n.n),...paging(q)};
    }
    async service(actorId:string) {
        const database=await this.database.status();
        await this.log(actorId,'service.read');
        return {database,checkedAt:new Date().toISOString(),environment:this.config.get<string>('NODE_ENV','development'),apiVersion:'0.3.0',
            modelVersion:MODEL_VERSION,catalogueVersion:CATALOGUE_VERSION,authConfigured:Boolean(this.config.get('SUPABASE_URL') && this.config.get('SUPABASE_PUBLISHABLE_KEY')),
            aiEnabled:this.config.get<boolean>('AI_ENABLED',false),aiUsage:await this.aiUsage.metrics(),billing:'not_connected',backups:'not_monitored'};
    }
}
