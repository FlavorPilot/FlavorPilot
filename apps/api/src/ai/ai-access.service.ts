import { Injectable, HttpException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import { DatabaseService } from '../database/database.service';
import { SupabaseAuthService } from '../auth/supabase-auth.service';
import { AiUsageService } from './ai-usage.service';
import type { AiActor } from './ai-actor';

@Injectable()
export class AiAccessService {
 constructor(private readonly database:DatabaseService,private readonly auth:SupabaseAuthService,private readonly usage:AiUsageService){}
 async resolve(request:FastifyRequest,allowMissing=false):Promise<AiActor|null> {
  // An invalid account bearer must never silently become guest access.
  if(request.headers.authorization!==undefined){
   const match=/^Bearer\s+([^\s]+)$/i.exec(request.headers.authorization);
   if(!match||match[1].length>8192)throw new UnauthorizedException({code:'MISSING_ACCESS_TOKEN'});
   return (await this.auth.verifyAccessToken(match[1])).id;
  }
  const token=request.headers['x-ai-guest-token'];
  if(token===undefined&&allowMissing)return null;
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw new UnauthorizedException({code:'AI_GUEST_SESSION_INVALID'});
  const hash=createHash('sha256').update(token).digest('hex');
  const [session]=await this.database.requireDatabase().execute<{id:string}>(sql`select id from public.ai_guest_sessions where token_hash=${hash} limit 1`);
  if(!session)throw new UnauthorizedException({code:'AI_GUEST_SESSION_INVALID'});
  return {guestId:session.id};
 }
 async createGuest(){
  if(!this.usage.testAccessEnabled())throw new ServiceUnavailableException({code:'AI_DISABLED'});
  const token=randomBytes(32).toString('hex'),hash=createHash('sha256').update(token).digest('hex');
  const actor=await this.database.requireDatabase().transaction(async tx=>{
   await tx.execute(sql`select pg_advisory_xact_lock(17001811)`);
   // Bound issuance across instances; no spoofable forwarded-IP trust or per-process counters.
   const [traffic]=await tx.execute<{day_count:number;recent:number}>(sql`select count(*)::int day_count,count(*) filter(where created_at>now()-interval '1 second')::int recent from public.ai_guest_sessions where created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'`);
   if(traffic.day_count>=100||traffic.recent>0)throw new HttpException({code:'AI_RATE_LIMITED'},429);
   const [row]=await tx.execute<{id:string}>(sql`insert into public.ai_guest_sessions(token_hash) values(${hash}) returning id`);
   return {guestId:row.id};
  });
  return {token,quota:await this.usage.capabilities(actor)};
 }
}
