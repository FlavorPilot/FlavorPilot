import { aiActorFilter, aiActorGuest, aiActorUser, type AiActor } from './ai-actor';
import { ConflictException, ForbiddenException, HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import type { AiCapabilities } from '@flavorpilot/contracts';
import { DatabaseService } from '../database/database.service';
import { AI_LIMITS, AI_MODEL, AI_PLANS, AI_PROMPT_VERSION, aiCost, aiPeriods, type AiFeature } from './ai.policy';
type UsageRow={id:string;content_hash:string;status:string;response:unknown;expires_at:Date;month_units:number;day_units:number};
@Injectable()
export class AiUsageService {
 constructor(private readonly database:DatabaseService,private readonly config:ConfigService){}
 private fail(code:string,status=429):never {throw new HttpException({code,message:code},status);}
 testAccessEnabled() { return this.config.get<boolean>('AI_ENABLED',false)&&this.config.get<boolean>('AI_TEST_ACCESS_ENABLED',false); }
 async capabilities(actor:AiActor|null,db=this.database.requireDatabase()):Promise<AiCapabilities> {
  const p=aiPeriods(),userId=actor===null?null:aiActorUser(actor);
  const [plan]=userId ? await db.execute<{tier:keyof typeof AI_PLANS;status:string;current_period_end:Date|null}>(sql`select tier,status,current_period_end from public.subscriptions where user_id=${userId} limit 1`) : [];
  const pilot=Boolean(userId&&this.config.get<string>('AI_PILOT_USER_IDS','').split(',').map(s=>s.trim()).includes(userId));
  const paid=plan && plan.tier!=='free' && ['active','trialing'].includes(plan.status) && (!plan.current_period_end||new Date(plan.current_period_end)>new Date());
  const test=!paid&&!pilot&&this.testAccessEnabled();
  const limits=test?{month:userId?100:50,day:userId?100:50}:AI_PLANS[paid ? plan.tier : pilot ? 'pro' : 'free'];
  const [used]=actor===null?[]:await db.execute<{month_units:number;day_units:number;test_units:number}>(sql`select coalesce(sum(units) filter(where created_at>=${p.month}),0)::int month_units,coalesce(sum(units) filter(where created_at>=${p.day}),0)::int day_units,coalesce(sum(units) filter(where test_access),0)::int test_units from public.ai_requests where ${aiActorFilter(actor)} and (status='succeeded' or (status='reserved' and expires_at>now()))`);
  const enabled=this.config.get<boolean>('AI_ENABLED',false),remaining=Math.max(0,limits.month-Number(test?used?.test_units??0:used?.month_units??0)),dailyRemaining=test?remaining:Math.max(0,limits.day-Number(used?.day_units??0));
  return {enabled,access:paid?'paid':pilot?'pilot':test?(userId?'free_test':'guest_test'):'none',allowancePeriod:test?'test':'calendar',remaining,dailyRemaining,resetAt:p.resetAt,dailyResetAt:p.dailyResetAt,costs:{explain:2,step:1,full:4,generate:4},reason:!enabled?'AI_DISABLED':!paid&&!pilot&&!test?'AI_PLAN_REQUIRED':!remaining||!dailyRemaining?'AI_QUOTA_EXCEEDED':null};
 }
 async reserve(userId:AiActor,requestId:string,hash:string,feature:AiFeature):Promise<{id:string;cached?:unknown}> {
  const db=this.database.requireDatabase();
  return db.transaction(async tx=>{
   // Global transaction lock coordinates budget reservations across processes/instances.
   await tx.execute(sql`select pg_advisory_xact_lock(17001810)`);
   await tx.execute(sql`update public.ai_requests set status='unknown',units=0 where status='reserved' and expires_at<=now()`);
   await tx.execute(sql`delete from public.ai_response_cache where expires_at<=now()`);
   const q=await this.capabilities(userId,tx);
   if(!q.enabled)throw new ServiceUnavailableException({code:'AI_DISABLED',message:'AI is disabled'});
   if(q.access==='none')throw new ForbiddenException({code:'AI_PLAN_REQUIRED',message:'An active plan or pilot grant is required'});
   const [prior]=await tx.execute<UsageRow>(sql`select r.id,r.content_hash,r.status,c.response from public.ai_requests r left join public.ai_response_cache c on c.request_id=r.id and c.expires_at>now() where ${aiActorFilter(userId,true)} and r.request_id=${requestId} limit 1`);
   if(prior){
    if(prior.content_hash!==hash)throw new ConflictException({code:'AI_REQUEST_CONFLICT',message:'Request ID already used for another snapshot'});
    if(prior.status==='succeeded'&&prior.response)return {id:prior.id,cached:prior.response};
    this.fail(prior.status==='reserved'?'AI_REQUEST_PENDING':'AI_REQUEST_FINISHED',409);
   }
   const [cached]=await tx.execute<UsageRow>(sql`select r.id,c.response,c.expires_at from public.ai_requests r join public.ai_response_cache c on c.request_id=r.id where ${aiActorFilter(userId,true)} and r.content_hash=${hash} and r.status='succeeded' and c.expires_at>now() order by r.created_at desc limit 1`);
   if(cached){
    const expiresAt=new Date(cached.expires_at).toISOString();
    const [r]=await tx.execute<UsageRow>(sql`insert into public.ai_requests(user_id,guest_id,test_access,request_id,content_hash,feature,model,prompt_version,status,units,reserved_microusd,expires_at) values(${aiActorUser(userId)},${aiActorGuest(userId)},${q.allowancePeriod==='test'},${requestId},${hash},${feature},${AI_MODEL},${AI_PROMPT_VERSION},'succeeded',0,0,${expiresAt}) returning id`);
    await tx.execute(sql`insert into public.ai_response_cache(request_id,response,expires_at) values(${r.id},${JSON.stringify(cached.response)}::jsonb,${expiresAt})`);
    return {id:r.id,cached:cached.response};
   }
   const limit=AI_LIMITS[feature];
   if(q.remaining<limit.units||q.dailyRemaining<limit.units)this.fail('AI_QUOTA_EXCEEDED');
   const [traffic]=await tx.execute<{active:number;minute_count:number;recent_step:number}>(sql`select count(*) filter(where status='reserved' and expires_at>now())::int active,count(*) filter(where created_at>now()-interval '1 minute' and reserved_microusd>0)::int minute_count,count(*) filter(where feature='step' and created_at>now()-interval '20 seconds' and reserved_microusd>0)::int recent_step from public.ai_requests where ${aiActorFilter(userId)} and created_at>now()-interval '2 minutes'`);
   if(traffic.active)this.fail('AI_REQUEST_PENDING',409);
   if(traffic.minute_count>=4||(feature==='step'&&traffic.recent_step>0))this.fail('AI_RATE_LIMITED');
   const p=aiPeriods(),reserve=aiCost(limit.input,limit.output);
   const [cost]=await tx.execute<{month_cost:number;day_cost:number}>(sql`select coalesce(sum(case when status in ('reserved','unknown') then reserved_microusd else charged_microusd end),0)::bigint as month_cost,coalesce(sum(case when status in ('reserved','unknown') then reserved_microusd else charged_microusd end) filter(where created_at>=${p.day}),0)::bigint as day_cost from public.ai_requests where created_at>=${p.month}`);
   if(Number(cost.month_cost)+reserve>this.config.get<number>('AI_MONTHLY_BUDGET_USD',50)*1e6||Number(cost.day_cost)+reserve>this.config.get<number>('AI_DAILY_BUDGET_USD',5)*1e6)this.fail('AI_BUDGET_EXCEEDED',503);
   const [r]=await tx.execute<UsageRow>(sql`insert into public.ai_requests(user_id,guest_id,test_access,request_id,content_hash,feature,model,prompt_version,status,units,reserved_microusd,expires_at) values(${aiActorUser(userId)},${aiActorGuest(userId)},${q.allowancePeriod==='test'},${requestId},${hash},${feature},${AI_MODEL},${AI_PROMPT_VERSION},'reserved',${limit.units},${reserve},now()+interval '90 seconds') returning id`);
   return {id:r.id};
  });
 }
 async finish(id:string,outcome:{status:'succeeded'|'failed'|'unknown';usage?:{input:number;output:number;reasoning:number};response?:unknown;duration:number;knownZero?:boolean}) {
  const db=this.database.requireDatabase();
  await db.transaction(async tx=>{
   await tx.execute(sql`select pg_advisory_xact_lock(17001810)`);
   const u=outcome.usage;
   await tx.execute(sql`update public.ai_requests set status=${outcome.status},units=case when ${outcome.status}='succeeded' then units else 0 end,charged_microusd=${u?aiCost(u.input,u.output):0},input_tokens=${u?.input??null},output_tokens=${u?.output??null},reasoning_tokens=${u?.reasoning??null},duration_ms=${outcome.duration} where id=${id} and status in ('reserved','unknown')`);
   if(outcome.status==='succeeded'&&outcome.response!==undefined)
    await tx.execute(sql`insert into public.ai_response_cache(request_id,response,expires_at) values(${id},${JSON.stringify(outcome.response)}::jsonb,now()+interval '30 minutes') on conflict(request_id) do nothing`);
  });
 }
 async metrics(){
  const p=aiPeriods(),db=this.database.requireDatabase();
  const [r]=await db.execute<{requests:number;errors:number;unknown:number;input:number;output:number;reasoning:number;spent:number;reserved:number;latency:number}>(sql`select count(*) filter(where reserved_microusd>0)::int requests,count(*) filter(where status='failed')::int errors,count(*) filter(where status='unknown' or (status='reserved' and expires_at<=now()))::int unknown,coalesce(sum(input_tokens),0)::bigint input,coalesce(sum(output_tokens),0)::bigint output,coalesce(sum(reasoning_tokens),0)::bigint reasoning,coalesce(sum(charged_microusd),0)::bigint spent,coalesce(sum(reserved_microusd) filter(where status in ('reserved','unknown')),0)::bigint reserved,coalesce(avg(duration_ms),0)::int latency from public.ai_requests where created_at>=${p.month}`);
  return {model:AI_MODEL,requests:Number(r.requests),errors:Number(r.errors),unknown:Number(r.unknown),inputTokens:Number(r.input),outputTokens:Number(r.output),reasoningTokens:Number(r.reasoning),spentUsd:Number(r.spent)/1e6,reservedUsd:Number(r.reserved)/1e6,monthlyBudgetUsd:this.config.get<number>('AI_MONTHLY_BUDGET_USD',50),dailyBudgetUsd:this.config.get<number>('AI_DAILY_BUDGET_USD',5),averageLatencyMs:Number(r.latency)};
 }
}
