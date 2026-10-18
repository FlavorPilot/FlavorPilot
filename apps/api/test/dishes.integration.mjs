import 'reflect-metadata';
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { resetTestDatabase } from './reset-database.mjs';
import { startAuthStub } from './auth-stub.mjs';
import { analyzeDish, MODEL_VERSION, CATALOGUE_VERSION } from '@flavorpilot/flavor-engine';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

const databaseUrl = process.env.FLAVORPILOT_TEST_DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:54329/flavorpilot_test';
process.env.DATABASE_URL = databaseUrl;
process.env.DATABASE_SSL = 'disable';
process.env.NODE_ENV = 'test';
process.env.AI_ENABLED = 'false';
process.env.ADMIN_REQUIRE_MFA = 'false'; // Local opaque-token stub has no MFA sessions.
process.env.SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
process.env.SWAGGER_ENABLED = 'false';
process.env.CORS_ORIGINS = 'http://127.0.0.1:3000';

const items = [{ ingredientId: 'salmon', grams: 140, preparationId: 'seared' }, { ingredientId: 'lime', grams: 12, preparationId: 'raw' }];
let app;
let base;
let sql;
let stub;

async function signup(label) {
    const email = `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
    const response = await fetch(`${stub.url}/auth/v1/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: stub.key }, body: JSON.stringify({ email, password: 'test-password' }) });
    const body = await response.json();
    assert.equal(response.status, 200, body.msg);
    return { email, token: body.access_token, id: body.user.id };
}

async function api(path, { method = 'GET', token, body } = {}) {
    const response = await fetch(`${base}${path}`, {
        method,
        headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
}

before(async () => {
    await resetTestDatabase(databaseUrl);
    stub = await startAuthStub({ databaseUrl });
    process.env.SUPABASE_URL = stub.url;
    const { AppModule } = await import('../dist/app.module.js');
    const { AllExceptionsFilter } = await import('../dist/common/all-exceptions.filter.js');
    app = await NestFactory.create(AppModule, new FastifyAdapter({ trustProxy: false, bodyLimit: 1048576 }), { logger: false });
    app.setGlobalPrefix('v1');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.enableShutdownHooks();
    await app.listen(0, '127.0.0.1');
    base = `${await app.getUrl()}/v1`;
    sql = postgres(databaseUrl, { max: 1, prepare: false, ssl: false });
});

after(async () => {
    await app?.close();
    await stub?.close();
    await sql?.end();
});

it('round-trips recipe steps, protects stale edits and preserves remix/snapshot contents',async()=>{
 const a=await signup('recipe-cloud'),b=await signup('recipe-other');
 const steps=[{id:randomUUID(),text:'Sear salmon, then add lime.'}];
 const made=await api('/dishes',{method:'POST',token:a.token,body:{name:'Cloud recipe',items,steps,servings:2,visibility:'public'}});
 assert.equal(made.status,201);assert.deepEqual(made.body.steps,steps);assert.equal(made.body.servings,2);
 const id=made.body.id;
 const wrong=await api(`/dishes/${id}`,{method:'PATCH',token:b.token,body:{steps:[]}});assert.equal(wrong.status,404);
 const changed=await api(`/dishes/${id}`,{method:'PATCH',token:a.token,body:{name:'New title',expectedVersionNumber:1}});
 assert.equal(changed.status,200);assert.deepEqual(changed.body.steps,steps);
 const stale=await api(`/dishes/${id}`,{method:'PATCH',token:a.token,body:{steps:[],expectedVersionNumber:1}});
 assert.equal(stale.status,409);assert.equal(stale.body.code,'DISH_UPDATE_CONFLICT');
 const publicRead=await api(`/dishes/public/${id}`);assert.deepEqual(publicRead.body.steps,steps);
 const remix=await api(`/dishes/${id}/remix`,{method:'POST',token:b.token,body:{}});
 assert.equal(remix.status,201);assert.deepEqual(remix.body.steps,steps);assert.equal(remix.body.servings,2);
 const [version]=await sql`select snapshot from public.dish_versions where dish_id=${id} order by version_number desc limit 1`;
 assert.deepEqual(version.snapshot.steps,steps);assert.equal(version.snapshot.servings,2);
 const migration=readFileSync(fileURLToPath(new URL('../../../supabase/migrations/20261018125915_recipe_cloud_and_ai_usage.sql',import.meta.url)),'utf8');
 await sql.unsafe(migration);await sql.unsafe(migration);
 await assert.rejects(sql`update public.dishes set steps=${JSON.stringify([steps[0],steps[0]])}::jsonb where id=${id}`,/dishes_recipe_content_valid/);
 for(const role of ['anon','authenticated'])await assert.rejects(sql.begin(async tx=>{await tx.unsafe(`set local role ${role}`);await tx`select id from public.ai_requests where true`;}),/permission denied/);
});

it('enforces AI entitlements, idempotency, input/output controls and uncertain-cost accounting',async()=>{
 const a=await signup('ai-pilot'),free=await signup('ai-free');
 const config=app.get(ConfigService),originalFetch=globalThis.fetch;
 const {AiUsageService}=await import('../dist/ai/ai-usage.service.js');const usage=app.get(AiUsageService);
 const {AiService}=await import('../dist/ai/ai.service.js');const service=app.get(AiService);
 const stepId=randomUUID();let mode='valid',generations=0,counts=0;
 config.set('AI_ENABLED',true);config.set('OPENAI_API_KEY','fake-local-key');config.set('AI_PILOT_USER_IDS',a.id);
 const recipe={name:'Review',goal:'balanced',items,description:'',servings:2,steps:[{id:stepId,text:'Sear salmon.'}]};
 const body=(extra={})=>({requestId:randomUUID(),locale:'uk',scope:'full',recipe,...extra});
 globalThis.fetch=async(url,options)=>{
  if(!String(url).startsWith('https://api.openai.com/v1/'))return originalFetch(url,options);
  const input=JSON.parse(options.body);assert.equal(input.model,'gpt-6-luna');
  if(String(url).endsWith('input_tokens')){counts++;return Response.json({input_tokens:mode==='large'?20000:1000});}
  generations++;assert.equal(input.store,false);assert.equal(input.max_output_tokens,4000);assert.match(input.input[0].content[0].text,/Ukrainian/);
  assert.equal(input.service_tier,'default');assert.deepEqual(input.prompt_cache_options,{mode:'explicit'});
  assert.ok(input.input.every(message=>message.content.every(content=>!content.prompt_cache_breakpoint)));
  if(mode==='timeout')throw new Error('Simulated lost response');
  const comments=[{id:randomUUID(),kind:'clarity',stepId:mode==='invalid'?randomUUID():stepId,message:'Уточніть тривалість.',suggestedText:'Обсмажте лосось, уточнивши час.'}];
  return Response.json({status:mode==='incomplete'?'incomplete':'completed',usage:{input_tokens:1000,output_tokens:200,output_tokens_details:{reasoning_tokens:0}},output:[{content:[{type:'output_text',text:JSON.stringify({comments})}]}]});
 };
 try{
  const denied=await api('/ai/review-recipe',{method:'POST',token:free.token,body:body()});assert.equal(denied.status,403);assert.equal(generations,0);assert.equal(counts,0);
  const expired=await sql`update public.subscriptions set tier='pro',status='active',current_period_end=now()-interval '1 day' where user_id=${free.id}`;
  assert.equal((await api('/ai/review-recipe',{method:'POST',token:free.token,body:body()})).status,403);
  const missing=await api('/ai/review-recipe',{method:'POST',token:a.token,body:body({dishId:randomUUID()})});assert.equal(missing.status,404);assert.equal(generations,0);
  const request=body(),first=await api('/ai/review-recipe',{method:'POST',token:a.token,body:request});
  assert.equal(first.status,201,JSON.stringify(first.body));assert.equal(first.body.comments[0].stepId,stepId);assert.equal(first.body.quota.remaining,296);
  const [priced]=await sql`select model,reserved_microusd,charged_microusd from public.ai_requests where user_id=${a.id} and request_id=${request.requestId}`;
  assert.equal(priced.model,'gpt-6-luna');assert.equal(priced.reserved_microusd,3200);assert.equal(priced.charged_microusd,200);
  const repeated=await api('/ai/review-recipe',{method:'POST',token:a.token,body:request});assert.equal(repeated.status,201);assert.equal(generations,1);
  const cached=await api('/ai/review-recipe',{method:'POST',token:a.token,body:body()});assert.equal(cached.status,201);assert.equal(generations,1);assert.equal(cached.body.quota.remaining,296);
  const conflict=await api('/ai/review-recipe',{method:'POST',token:a.token,body:{...request,recipe:{...recipe,name:'Other'}}});assert.equal(conflict.status,409);
  for(const testMode of ['large','invalid','incomplete','timeout']){
   mode=testMode;await sql`update public.ai_requests set created_at=now()-interval '2 minutes' where user_id=${a.id}`;
   const r=await api('/ai/review-recipe',{method:'POST',token:a.token,body:body({recipe:{...recipe,name:testMode}})});
   assert.equal(r.status,testMode==='large'?400:502,JSON.stringify(r.body));
   const [entry]=await sql`select status,units,reserved_microusd,charged_microusd from public.ai_requests where user_id=${a.id} order by created_at desc limit 1`;
   assert.equal(entry.units,0);assert.equal(entry.status,testMode==='timeout'?'unknown':'failed');
   if(testMode==='timeout')assert.ok(entry.reserved_microusd>0);
   else if(testMode==='large')assert.equal(entry.charged_microusd,0);
   else assert.ok(entry.charged_microusd>0);
  }
  await sql`update public.ai_requests set created_at=now()-interval '2 minutes' where user_id=${a.id}`;
  const before=generations;
  const candidates=await Promise.allSettled([usage.reserve(a.id,randomUUID(),'concurrent-a','full'),usage.reserve(a.id,randomUUID(),'concurrent-b','full')]);
  assert.equal(candidates.filter(x=>x.status==='fulfilled').length,1);assert.equal(generations,before);
  const reservation=candidates.find(x=>x.status==='fulfilled').value;
  await usage.finish(reservation.id,{status:'failed',knownZero:true,duration:1});
  await sql`update public.ai_requests set created_at=now()-interval '2 minutes' where user_id=${a.id}`;
  config.set('AI_DAILY_BUDGET_USD',0.000001);
  await assert.rejects(usage.reserve(a.id,randomUUID(),'budget','full'),/AI_BUDGET_EXCEEDED/);
  config.set('AI_DAILY_BUDGET_USD',5);
  await sql`insert into public.ai_requests(user_id,request_id,content_hash,feature,model,prompt_version,status,units,reserved_microusd,expires_at) select ${a.id},gen_random_uuid(),'quota-'||n,'full','test','test','succeeded',4,0,now() from generate_series(1,7) n`;
  await assert.rejects(usage.reserve(a.id,randomUUID(),'quota-exhausted','full'),/AI_QUOTA_EXCEEDED/);
  assert.equal((await api('/ai/explain',{method:'POST',token:free.token,body:{locale:'en',dishName:'Free bypass',items}})).status,403);
  const metrics=await usage.metrics();assert.ok(metrics.unknown>=1);assert.ok(metrics.reservedUsd>0);
 }finally{globalThis.fetch=originalFetch;config.set('AI_ENABLED',false);config.set('AI_PILOT_USER_IDS','');config.set('AI_DAILY_BUDGET_USD',5);}
});

it('hardens internal trigger RPC permissions while preserving signup and repeatable migration', async () => {
    const migration = readFileSync(fileURLToPath(new URL('../../../supabase/migrations/20261018122502_harden_trigger_function_permissions.sql', import.meta.url)), 'utf8');
    await sql.unsafe(migration);
    await sql.unsafe(migration);
    const functions = ['enforce_private_dish_limit', 'handle_new_user', 'preserve_dish_parent_lineage', 'validate_dish_item_catalog', 'validate_dish_parent'];
    for (const role of ['anon', 'authenticated']) {
        for (const name of functions) {
            const [row] = await sql`select has_function_privilege(${role}, ${`public.${name}()`}, 'execute') as allowed`;
            assert.equal(row.allowed, false, `${role} must not call ${name}`);
        }
    }
    const pinned = await sql`select p.proname, p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('set_updated_at','normalize_dish_publication')`;
    assert.equal(pinned.length, 2);
    for (const row of pinned) assert.ok(row.proconfig.includes('search_path=public'));
    const user = await signup('hardened-trigger');
    const [profile] = await sql`select id from public.profiles where id=${user.id}::uuid`;
    const [subscription] = await sql`select user_id from public.subscriptions where user_id=${user.id}::uuid`;
    assert.equal(profile.id, user.id);
    assert.equal(subscription.user_id, user.id);
});

describe('administration and support on PostgreSQL',()=>{
    async function owner(label){const u=await signup(label);await sql`insert into public.admin_memberships(user_id) values(${u.id}::uuid)`;return u;}
    it('bootstraps owners only through the explicit operator command and audits grants and revocation',async()=>{
        const a=await signup('crm-bootstrap'),script=fileURLToPath(new URL('../../../scripts/admin-owner.mjs',import.meta.url));
        const args=['grant',a.id,'Local test owner assignment'];
        const dry=execFileSync(process.execPath,[script,...args],{env:{...process.env,DATABASE_URL:'postgres://private:do-not-print@invalid.invalid/private'},encoding:'utf8'});
        assert.match(dry,/Dry run/);assert.ok(!dry.includes('do-not-print'));
        assert.equal((await api('/admin/access',{token:a.token})).status,403);
        execFileSync(process.execPath,[script,...args,'--apply'],{env:{...process.env,DATABASE_URL:databaseUrl},encoding:'utf8'});
        assert.equal((await api('/admin/access',{token:a.token})).status,200);
        execFileSync(process.execPath,[script,'revoke',a.id,'Local test access removal','--apply'],{env:{...process.env,DATABASE_URL:databaseUrl},encoding:'utf8'});
        assert.equal((await api('/admin/access',{token:a.token})).status,403);
        const events=await sql`select action,actor_id from public.admin_audit_events where target_id=${a.id} order by created_at,id`;
        assert.deepEqual(events.map(e=>e.action),['owner.grant','owner.revoke']);assert.ok(events.every(e=>e.actor_id===null));
    });
    it('requires verified authentication, an active server assignment and MFA; revocation is immediate',async()=>{
        const a=await owner('crm-owner'),b=await signup('crm-user');
        for(const route of ['access','overview','users','recipes','feedback','catalogue','audit','service','support']){
            assert.equal((await api(`/admin/${route}`)).status,401,route);
            assert.equal((await api(`/admin/${route}`,{token:b.token})).status,403,route);
        }
        assert.equal((await api('/admin/overview',{token:'header.eyJhYWwiOiJhYWwyIn0.fake'})).status,401);
        const config=app.get((await import('@nestjs/config')).ConfigService);
        config.set('ADMIN_REQUIRE_MFA',true);
        try{
            assert.equal((await api('/admin/access',{token:a.token})).body.mfaVerified,false);
            const denied=await api('/admin/overview',{token:a.token});assert.equal(denied.status,403);assert.equal(denied.body.code,'ADMIN_MFA_REQUIRED');
        }finally{config.set('ADMIN_REQUIRE_MFA',false);}
        const access=await api('/admin/access',{token:a.token});assert.equal(access.body.role,'owner');
        assert.equal((await api('/admin/overview',{token:a.token})).status,200);
        await sql`update public.admin_memberships set active=false where user_id=${a.id}::uuid`;
        assert.equal((await api('/admin/overview',{token:a.token})).status,403);
    });
    it('provides bounded metadata, catalogue and honest service states without private contents or capabilities',async()=>{
        const a=await owner('crm-reader'),b=await signup('crm-profile');
        const secret=await api('/dishes',{method:'POST',token:b.token,body:{name:'PRIVATE RECIPE CONTENT',items}});
        assert.equal(secret.status,201);
        const user=await api(`/admin/users/${b.id}`,{token:a.token});assert.equal(user.status,200);
        assert.equal(user.body.recipeCount,1);assert.equal(user.body.publicRecipes.length,0);
        assert.ok(!JSON.stringify(user.body).includes('PRIVATE RECIPE CONTENT'));assert.ok(!JSON.stringify(user.body).includes(secret.body.shareToken));
        assert.equal(user.body.profile.email,undefined);
        const users=await api('/admin/users?limit=1',{token:a.token});assert.equal(users.body.items.length,1);assert.ok(users.body.total>=2);
        assert.equal((await api('/admin/users?includePrivate=true',{token:a.token})).status,400);
        assert.equal((await api('/admin/users?limit=500',{token:a.token})).status,400);
        assert.equal((await api('/admin/users/not-a-uuid',{token:a.token})).status,400);
        const catalogue=await api('/admin/catalogue?search=avocado',{token:a.token});assert.equal(catalogue.status,200);assert.equal(catalogue.body.items[0].id,'avocado');
        assert.ok(catalogue.body.items[0].preparations.length>0);assert.equal(catalogue.body.items[0].reviewStatus,'unreviewed');
        const health=await api('/admin/service',{token:a.token});assert.equal(health.body.database,'connected');assert.equal(health.body.billing,'not_connected');assert.equal(health.body.backups,'not_monitored');
        const publicRows=await api('/admin/recipes',{token:a.token});assert.ok(!JSON.stringify(publicRows.body).includes('PRIVATE RECIPE CONTENT'));
    });
    it('restricts all public recipe paths without changing author privacy, content or ownership',async()=>{
        const a=await owner('crm-moderator'),b=await signup('crm-publisher'),c=await signup('crm-remixer');
        const dish=await api('/dishes',{method:'POST',token:b.token,body:{name:'Moderation probe',items,visibility:'public'}}),id=dish.body.id;
        assert.equal((await api(`/admin/recipes/${id}/moderation`,{method:'PATCH',token:c.token,body:{hidden:true,expectedHidden:false,expectedRevision:0,reason:'Spam confirmed'}})).status,403);
        assert.equal((await api(`/admin/recipes/${id}/moderation`,{method:'PATCH',token:a.token,body:{hidden:true,expectedHidden:false,expectedRevision:0,reason:''}})).status,400);
        assert.equal((await api(`/admin/recipes/${id}/moderation`,{method:'PATCH',token:a.token,body:{hidden:true,expectedHidden:false,expectedRevision:0,reason:'Spam confirmed'}})).status,200);
        assert.equal((await api(`/dishes/public/${id}`)).status,404);
        assert.equal((await api(`/dishes/share/${dish.body.shareToken}`)).status,404);
        assert.equal((await api(`/dishes/${id}/comments`)).status,404);
        assert.equal((await api(`/dishes/${id}/comments`,{method:'POST',token:c.token,body:{text:'Bypass?',versionNumber:1}})).status,404);
        assert.equal((await api(`/dishes/${id}/remix`,{method:'POST',token:c.token,body:{visibility:'private'}})).status,404);
        assert.equal((await api('/dishes',{method:'POST',token:c.token,body:{name:'Parent bypass',items,parentDishId:id}})).status,400);
        assert.equal((await api('/dishes/public?search=Moderation%20probe')).body.items.length,0);
        const own=await api(`/dishes/me/${id}`,{token:b.token});assert.equal(own.status,200);assert.equal(own.body.visibility,'public');assert.equal(own.body.moderationHidden,true);
        assert.deepEqual(own.body.items.map(({ingredientId,grams,preparationId})=>({ingredientId,grams,preparationId})),items);
        assert.equal((await api(`/admin/recipes/${id}/moderation`,{method:'PATCH',token:a.token,body:{hidden:false,expectedHidden:false,expectedRevision:0,reason:'Stale operation'}})).status,409);
        assert.equal((await api(`/admin/recipes/${id}/moderation`,{method:'PATCH',token:a.token,body:{hidden:false,expectedHidden:true,expectedRevision:1,reason:'Review accepted'}})).status,200);
        assert.equal((await api(`/dishes/public/${id}`)).status,200);
        await api(`/dishes/${id}`,{method:'PATCH',token:b.token,body:{visibility:'private'}});
        assert.equal((await api(`/admin/recipes/${id}/moderation`,{method:'PATCH',token:a.token,body:{hidden:false,expectedHidden:false,expectedRevision:0,reason:'No publication'}})).status,404);
        assert.equal((await api(`/dishes/public/${id}`)).status,404);
    });
    it('opens only explicitly shared feedback and protects immutable snapshots and review revisions',async()=>{
        const a=await owner('crm-reviewer'),b=await signup('crm-feedback');
        const input={recipe:{name:'Consent probe',description:'',servings:null,steps:[],goal:'fresh',items},modelVersion:MODEL_VERSION,catalogueVersion:CATALOGUE_VERSION,cooked:true,agreement:'partial',concerns:['balance'],note:'My experience'};
        const privateFeedback=await api('/feedback',{method:'POST',token:b.token,body:input}),id=privateFeedback.body.id;
        assert.equal((await api('/admin/feedback',{token:a.token})).body.items.some(f=>f.id===id),false);
        const review={status:'reviewing',note:'Check acidity',expectedRevision:0,expectedUpdatedAt:privateFeedback.body.updatedAt};
        assert.equal((await api(`/admin/feedback/${id}/review`,{method:'PATCH',token:a.token,body:review})).status,404);
        const shared=await api('/feedback',{method:'POST',token:b.token,body:{...input,allowTeamReview:true}});assert.equal(shared.body.id,id);
        const visible=(await api('/admin/feedback',{token:a.token})).body.items.find(f=>f.id===id);assert.equal(visible.review.revision,0);
        const current={...review,expectedUpdatedAt:shared.body.updatedAt};
        assert.equal((await api(`/admin/feedback/${id}/review`,{method:'PATCH',token:a.token,body:current})).status,200);
        assert.equal((await api(`/admin/feedback/${id}/review`,{method:'PATCH',token:a.token,body:current})).status,409);
        const after=await api(`/feedback/${id}`,{token:b.token});assert.deepEqual(after.body.analysis,shared.body.analysis);assert.equal(after.body.note,input.note);
        assert.equal(after.body.review,undefined);
        await api('/feedback',{method:'POST',token:b.token,body:{...input,allowTeamReview:true}});
        const unchanged=(await api('/admin/feedback',{token:a.token})).body.items.find(f=>f.id===id);
        assert.equal(unchanged.review.status,'reviewing');assert.equal(unchanged.review.revision,1);
        await api('/feedback',{method:'POST',token:b.token,body:{...input,note:'Updated cooking experience',allowTeamReview:true}});
        const reopened=(await api('/admin/feedback',{token:a.token})).body.items.find(f=>f.id===id);
        assert.equal(reopened.review.status,'new');assert.equal(reopened.review.revision,2);
        await api('/feedback',{method:'POST',token:b.token,body:{...input,allowTeamReview:false}});
        assert.equal((await api('/admin/feedback',{token:a.token})).body.items.some(f=>f.id===id),false);
        assert.equal((await api(`/admin/feedback/${id}/review`,{method:'PATCH',token:a.token,body:{...current,expectedRevision:1}})).status,404);
        await api('/feedback',{method:'POST',token:b.token,body:{...input,allowTeamReview:true}});
        assert.equal((await api('/feedback/mine',{token:b.token})).body.items.some(f=>f.id===id),true);
        assert.equal((await api('/feedback/mine',{token:a.token})).body.items.some(f=>f.id===id),false);
        assert.equal((await api(`/feedback/${id}/permission`,{method:'PATCH',token:a.token,body:{allowTeamReview:false}})).status,404);
        assert.equal((await api(`/feedback/${id}/permission`,{method:'PATCH',token:b.token,body:{allowTeamReview:true}})).status,400);
        assert.equal((await api(`/feedback/${id}/permission`,{method:'PATCH',token:b.token,body:{allowTeamReview:false}})).status,200);
        assert.equal((await api('/admin/feedback',{token:a.token})).body.items.some(f=>f.id===id),false);
    });
    it('isolates support conversations, preserves idempotent retries and enforces revision and creation limits',async()=>{
        const a=await owner('crm-support'),b=await signup('crm-ticket-owner'),c=await signup('crm-ticket-visitor');
        const body={subject:'Help saving recipe',category:'recipe',text:'PRIVATE SUPPORT TEXT',requestId:crypto.randomUUID()};
        const created=await api('/support',{method:'POST',token:b.token,body}),id=created.body.ticket.id;
        assert.equal(created.status,201);assert.equal(created.body.messages[0].fromStaff,false);
        assert.equal((await api('/support',{method:'POST',token:b.token,body})).body.ticket.id,id);
        assert.equal((await api('/support',{method:'POST',token:b.token,body:{...body,text:'Different payload'}})).status,409);
        assert.equal((await api('/support',{method:'POST',token:b.token,body:{...body,ownerId:a.id}})).status,400);
        assert.equal((await api(`/support/${id}`,{token:c.token})).status,404);assert.equal((await api(`/support/${id}`)).status,401);
        assert.equal((await api('/support',{token:c.token})).body.items.length,0);
        const reply={text:'Please retry after refreshing.',requestId:crypto.randomUUID()};
        const answered=await api(`/admin/support/${id}/messages`,{method:'POST',token:a.token,body:reply});assert.equal(answered.status,201);assert.equal(answered.body.messages.length,2);assert.equal(answered.body.messages[1].fromStaff,true);
        assert.equal((await api(`/admin/support/${id}/messages`,{method:'POST',token:a.token,body:reply})).body.messages.length,2);
        assert.equal((await api(`/support/${id}/messages`,{method:'POST',token:c.token,body:reply})).status,404);
        const status={status:'resolved',priority:'high',assignedToSelf:true,reason:'User issue resolved',expectedRevision:answered.body.ticket.revision};
        assert.equal((await api(`/admin/support/${id}`,{method:'PATCH',token:a.token,body:status})).status,200);
        assert.equal((await api(`/admin/support/${id}`,{method:'PATCH',token:a.token,body:status})).status,409);
        assert.equal((await api(`/support/${id}/messages`,{method:'POST',token:b.token,body:{text:'Another reply',requestId:crypto.randomUUID()}})).status,409);
        assert.equal((await api(`/support/${id}`,{token:b.token})).body.messages.length,2);
        const audit=await api('/admin/audit?search=support',{token:a.token});assert.ok(audit.body.items.some(e=>e.action==='support.reply'));assert.ok(!JSON.stringify(audit.body).includes('PRIVATE SUPPORT TEXT'));
        for(let n=0;n<5;n++)assert.equal((await api('/support',{method:'POST',token:b.token,body:{...body,requestId:crypto.randomUUID(),subject:`Open ticket ${n}`}})).status,201);
        assert.equal((await api('/support',{method:'POST',token:b.token,body:{...body,requestId:crypto.randomUUID()}})).status,429);
    });
    it('keeps migration 0010 repeatable and denies direct roles all administrative/support tables',async()=>{
        const before=await sql`select (select count(*)::int from public.support_tickets) as tickets,(select count(*)::int from public.admin_memberships) as owners`;
        const migration=readFileSync(new URL('../../../supabase/migrations/0010_administration.sql',import.meta.url),'utf8');
        await sql.unsafe(migration);await sql.unsafe(migration);
        assert.deepEqual(await sql`select (select count(*)::int from public.support_tickets) as tickets,(select count(*)::int from public.admin_memberships) as owners`,before);
        for(const role of ['anon','authenticated'])for(const table of ['admin_memberships','admin_audit_events','feedback_reviews','support_tickets','support_messages']){
            await assert.rejects(sql.begin(async tx=>{await tx.unsafe(`set local role ${role}`);await tx.unsafe(`select * from public.${table}`);}),/permission denied/);
        }
    });
});

describe('dish ownership on PostgreSQL', () => {
    it('stores private server-computed feedback and preserves independent before/after cooking snapshots', async () => {
        const owner=await signup('feedback-owner'), other=await signup('feedback-other');
        const created=await api('/dishes',{method:'POST',token:owner.token,body:{name:'Feedback fish',goal:'fresh',items}});
        const recipe={name:'Feedback fish',description:'',servings:null,steps:[],goal:'fresh',items};
        const input={recipe,dishId:created.body.id,modelVersion:MODEL_VERSION,catalogueVersion:CATALOGUE_VERSION,cooked:false,agreement:'partial',concerns:['balance'],note:'My expectation'};
        assert.equal((await api('/feedback',{method:'POST',body:input})).status,401);
        assert.equal((await api('/feedback',{method:'POST',token:other.token,body:input})).status,404);
        assert.equal((await api('/feedback',{method:'POST',token:owner.token,body:{...input,analysis:{overallScore:100}}})).status,400);
        assert.equal((await api('/feedback',{method:'POST',token:owner.token,body:{...input,modelVersion:'old'}})).status,409);
        assert.equal((await api('/feedback',{method:'POST',token:owner.token,body:{...input,recipe:{...recipe,items:[...items,{...items[0]}]}}})).status,400);
        const saved=await api('/feedback',{method:'POST',token:owner.token,body:input});
        assert.equal(saved.status,201);
        assert.equal(saved.body.dishVersionNumber,1);
        assert.deepEqual(saved.body.analysis,analyzeDish(items,'fresh',false));
        assert.deepEqual(saved.body.recipe,recipe);
        assert.equal((await api(`/feedback/${saved.body.id}`)).status,401);
        assert.equal((await api(`/feedback/${saved.body.id}`,{token:other.token})).status,404);
        assert.equal((await api(`/feedback/${saved.body.id}`,{method:'DELETE',token:other.token})).status,404);
        const after=await api('/feedback',{method:'POST',token:owner.token,body:{...input,cooked:true,note:'Actual result'}});
        assert.notEqual(after.body.id,saved.body.id);
        const retry=await api('/feedback',{method:'POST',token:owner.token,body:{...input,cooked:true,note:'Updated result'}});
        assert.equal(retry.body.id,after.body.id);
        const counts=await sql`select count(*)::int as n from public.model_feedback where author_id=${owner.id}`;
        assert.equal(counts[0].n,2);
        const changedItems=[{...items[0],grams:180},items[1]];
        await api(`/dishes/${created.body.id}`,{method:'PATCH',token:owner.token,body:{items:changedItems}});
        const old=await api(`/feedback/${saved.body.id}`,{token:owner.token});
        assert.deepEqual(old.body.analysis,saved.body.analysis);
        assert.equal(old.body.dishVersionNumber,1);
        const oldVersion=await api('/feedback',{method:'POST',token:owner.token,body:{...input,dishVersionNumber:1,note:'Reviewed the original after an edit'}});
        assert.equal(oldVersion.body.id,saved.body.id);
        assert.equal(oldVersion.body.dishVersionNumber,1);
        const changed=await api('/feedback',{method:'POST',token:owner.token,body:{...input,recipe:{...recipe,items:changedItems},cooked:true}});
        assert.equal(changed.body.dishVersionNumber,2);
        const draft=await api('/feedback',{method:'POST',token:owner.token,body:{...input,recipe:{...recipe,description:'Unsaved instructions',servings:2,steps:[{id:crypto.randomUUID(),text:'Cook and taste.'}]}}});
        assert.equal(draft.body.dishVersionNumber,null);
        assert.equal(draft.body.recipe.steps[0].text,'Cook and taste.');
        assert.equal((await api(`/feedback/${saved.body.id}`,{method:'DELETE',token:owner.token})).status,204);
        assert.equal((await api(`/feedback/${saved.body.id}`,{token:owner.token})).status,404);
    });
    it('authorizes public comments, one-level replies and deletion without removing other people’s replies', async () => {
        const owner=await signup('comments-owner'), visitor=await signup('comments-visitor');
        const created=await api('/dishes',{method:'POST',token:owner.token,body:{name:'Discussion fish',goal:'fresh',visibility:'public',items}});
        assert.equal(created.body.versionNumber,1);
        const endpoint=`/dishes/${created.body.id}/comments`;
        assert.equal((await api(endpoint)).status,200);
        assert.equal((await api(endpoint,{method:'POST',body:{text:'Question',versionNumber:1}})).status,401);
        assert.equal((await api(endpoint,{method:'POST',token:visitor.token,body:{text:' ',versionNumber:1}})).status,400);
        const comment=await api(endpoint,{method:'POST',token:visitor.token,body:{text:'I cooked this.',hasCooked:true,versionNumber:1}});
        assert.equal(comment.status,201);assert.equal(comment.body.hasCooked,true);assert.equal(comment.body.author.id,visitor.id);
        const reply=await api(endpoint,{method:'POST',token:owner.token,body:{text:'Thank you!',parentId:comment.body.id,versionNumber:1}});
        assert.equal(reply.status,201);assert.equal(reply.body.replyTo.text,'I cooked this.');
        assert.equal((await api(endpoint,{method:'POST',token:visitor.token,body:{text:'Nested reply',parentId:reply.body.id,versionNumber:1}})).status,409);
        const another=await api('/dishes',{method:'POST',token:owner.token,body:{name:'Other dish',visibility:'public',items}});
        assert.equal((await api(`/dishes/${another.body.id}/comments`,{method:'POST',token:visitor.token,body:{text:'Wrong parent',parentId:comment.body.id,versionNumber:1}})).status,409);
        assert.equal((await api(`${endpoint}/${comment.body.id}`,{method:'DELETE',token:owner.token})).status,404);
        await api(`/dishes/${created.body.id}`,{method:'PATCH',token:owner.token,body:{name:'Changed recipe'}});
        assert.equal((await api(endpoint,{method:'POST',token:visitor.token,body:{text:'Stale version',versionNumber:1}})).status,409);
        assert.equal((await api(`${endpoint}/${comment.body.id}`,{method:'DELETE',token:visitor.token})).status,204);
        const page=await api(endpoint);
        const deleted=page.body.items.find(row=>row.id===comment.body.id), retained=page.body.items.find(row=>row.id===reply.body.id);
        assert.equal(deleted.text,null);assert.equal(deleted.author,null);assert.equal(deleted.deleted,true);
        assert.equal(retained.text,'Thank you!');assert.equal(retained.replyTo.text,null);
        assert.equal((await api(endpoint,{method:'POST',token:owner.token,body:{text:'Reply to deleted',parentId:comment.body.id,versionNumber:2}})).status,409);
        assert.equal(JSON.stringify(page.body).includes('shareToken'),false);
        assert.equal(JSON.stringify(page.body).includes('access_token'),false);
        assert.equal((await api('/dishes/not-a-uuid/comments')).status,400);
        assert.equal((await api(`${endpoint}?cursor=invalid`)).status,400);
    });
    it('hides discussion when a recipe is private or unlisted, but lets authors remove their own words',async()=>{
        const owner=await signup('hidden-comments-owner'), visitor=await signup('hidden-comments-visitor');
        const recipe=await api('/dishes',{method:'POST',token:owner.token,body:{name:'Visibility discussion',visibility:'public',items}});
        const endpoint=`/dishes/${recipe.body.id}/comments`;
        const comment=await api(endpoint,{method:'POST',token:visitor.token,body:{text:'My words',versionNumber:1}});
        for(const visibility of ['private','unlisted']) {
            await api(`/dishes/${recipe.body.id}`,{method:'PATCH',token:owner.token,body:{visibility}});
            assert.equal((await api(endpoint)).status,404);
            assert.equal((await api(endpoint,{token:owner.token})).status,404);
            assert.equal((await api(endpoint,{method:'POST',token:visitor.token,body:{text:'Hidden',versionNumber:1}})).status,404);
        }
        assert.equal((await api(`${endpoint}/${comment.body.id}`,{method:'DELETE',token:visitor.token})).status,204);
    });
    it('paginates equal comment timestamps without duplicates or omissions and protects new tables from direct REST roles',async()=>{
        const owner=await signup('comment-paging');
        const recipe=await api('/dishes',{method:'POST',token:owner.token,body:{name:'Paged comments',visibility:'public',items}});
        for(let i=0;i<7;i++) await sql`insert into public.dish_comments(dish_id,author_id,body,version_number,created_at) values(${recipe.body.id},${owner.id},${`Comment ${i}`},1,'2026-10-18T10:00:00.000Z')`;
        let cursor,seen=[];
        do {
            const page=await api(`/dishes/${recipe.body.id}/comments?limit=3${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
            assert.equal(page.status,200);seen.push(...page.body.items.map(row=>row.id));cursor=page.body.nextCursor;
        }while(cursor);
        assert.equal(seen.length,7);assert.equal(new Set(seen).size,7);
        for(const role of ['anon','authenticated'])for(const table of ['model_feedback','dish_comments'])await assert.rejects(sql.begin(async tx=>{await tx.unsafe(`set local role ${role}`);await tx.unsafe(`select id from public.${table}`);}),/permission denied/);
        const migration=readFileSync(new URL('../../../supabase/migrations/0009_model_feedback_and_comments.sql',import.meta.url),'utf8');
        await sql.unsafe(migration);await sql.unsafe(migration);
        const stillPresent=await sql`select count(*)::int as n from public.dish_comments where dish_id=${recipe.body.id}`;
        assert.equal(stillPresent[0].n,7);
    });
    it('analyses and saves new catalogue foods through the authenticated API', async () => {
        const account = await signup('expanded-catalogue');
        const expandedItems = [{ ingredientId: 'shiitake', preparationId: 'roasted', grams: 150 }, { ingredientId: 'pumpkin_seed', preparationId: 'raw', grams: 15 }];
        const analysis = await api('/flavor/analyze', { method: 'POST', body: { items: expandedItems, goal: 'balanced', includeRecommendations: false } });
        assert.equal(analysis.status, 201);
        assert.equal(analysis.body.totalWeight, 165);
        assert.equal(analysis.body.composition.nutrients[0].contributions.length, 2);
        assert.ok(analysis.body.composition.nutrients[0].contributions.every(row => row.fdcId > 0));
        const saved = await api('/dishes', { method: 'POST', token: account.token, body: { name: 'Expanded catalogue recipe', goal: 'balanced', visibility: 'private', items: expandedItems } });
        assert.equal(saved.status, 201);
        assert.deepEqual(saved.body.items.map(({ingredientId,preparationId,grams}) => ({ingredientId,preparationId,grams})), expandedItems);
    });
    it('the expansion migration is repeatable and preserves reviewed values and private dishes', async () => {
        const migration = readFileSync(new URL('../../../supabase/migrations/0008_catalogue_expansion.sql', import.meta.url), 'utf8');
        const before = await sql`select id, visibility, owner_id from public.dishes order by id`;
        await sql`update public.ingredients set review_status='reviewed', reviewer='Test reviewer', source='Test attribution', last_reviewed_at=now(), intensity=1.23 where id='shiitake'`;
        await sql`update public.ingredient_nutrient_hypotheses set review_status='reviewed', reviewer='Test reviewer', last_reviewed_at=now(), protein_g=1.23 where identity_id='shiitake'`;
        try {
            await sql.unsafe(migration);
            await sql.unsafe(migration);
            const ingredient = await sql`select intensity, review_status from public.ingredients where id='shiitake'`;
            const nutrient = await sql`select protein_g, review_status from public.ingredient_nutrient_hypotheses where identity_id='shiitake'`;
            assert.equal(Number(ingredient[0].intensity), 1.23);
            assert.equal(Number(nutrient[0].protein_g), 1.23);
            assert.equal(ingredient[0].review_status, 'reviewed');
            assert.equal(nutrient[0].review_status, 'reviewed');
            assert.deepEqual(await sql`select id, visibility, owner_id from public.dishes order by id`, before);
            const counts = await sql`select count(*)::int as n from public.ingredients`;
            assert.equal(counts[0].n, 620);
        } finally {
            await sql`update public.ingredients set review_status='unreviewed', reviewer=null, last_reviewed_at=null where id='shiitake'`;
            await sql`update public.ingredient_nutrient_hypotheses set review_status='unreviewed', reviewer=null, last_reviewed_at=null where identity_id='shiitake'`;
            await sql.unsafe(migration);
        }
    });
    it('keeps a private dish visible only to its owner', async () => {
        const a = await signup('owner');
        const b = await signup('other');
        const created = await api('/dishes', { method: 'POST', token: a.token, body: { name: 'Private salmon', goal: 'fresh', visibility: 'private', items } });
        assert.equal(created.status, 201);
        assert.equal(created.body.visibility, 'private');
        assert.equal(created.body.ownerId, a.id);
        const id = created.body.id;
        const token = created.body.shareToken;
        assert.equal((await api(`/dishes/public/${id}`)).status, 404);
        assert.equal((await api(`/dishes/share/${token}`)).status, 404);
        assert.equal((await api('/dishes/me')).status, 401);
        assert.equal((await api(`/dishes/me/${id}`, { token: b.token })).status, 404);
        assert.equal((await api(`/dishes/${id}`, { method: 'PATCH', token: b.token, body: { name: 'Stolen' } })).status, 404);
        assert.equal((await api(`/dishes/${id}`, { method: 'DELETE', token: b.token })).status, 404);
        assert.equal((await api(`/dishes/${id}/remix`, { method: 'POST', token: b.token, body: { visibility: 'private' } })).status, 404);
        const listed = await api('/dishes/public?search=Private%20salmon&limit=20');
        assert.equal(listed.body.items.some(dish => dish.id === id), false);
        const mine = await api('/dishes/me', { token: b.token });
        assert.equal(mine.body.some(dish => dish.id === id), false);
        const again = await api('/dishes/me', { token: (await fetch(`${stub.url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: stub.key }, body: JSON.stringify({ email: a.email, password: 'test-password' }) }).then(res => res.json())).access_token });
        assert.equal(again.body.some(dish => dish.id === id && dish.items.length === 2), true);
    });

    it('publishes, shares an unlisted link, and remixes without changing the parent', async () => {
        const a = await signup('publisher');
        const b = await signup('remixer');
        const created = await api('/dishes', { method: 'POST', token: a.token, body: { name: 'Shareable salmon', goal: 'fresh', visibility: 'unlisted', items } });
        assert.equal(created.status, 201);
        const shared = await api(`/dishes/share/${created.body.shareToken}`);
        assert.equal(shared.status, 200);
        assert.equal(shared.body.shareToken, undefined);
        assert.equal(shared.body.name, 'Shareable salmon');
        const hidden = await api('/dishes/public?search=Shareable%20salmon&limit=20');
        assert.equal(hidden.body.items.some(dish => dish.id === created.body.id), false);
        const revoked = await api(`/dishes/${created.body.id}`, { method: 'PATCH', token: a.token, body: { visibility: 'private' } });
        assert.equal(revoked.status, 200);
        assert.equal((await api(`/dishes/share/${created.body.shareToken}`)).status, 404);
        const published = await api(`/dishes/${created.body.id}`, { method: 'PATCH', token: a.token, body: { visibility: 'public' } });
        assert.equal(published.status, 200);
        assert.equal(published.body.visibility, 'public');
        assert.ok(published.body.publishedAt);
        const opened = await api(`/dishes/public/${created.body.id}`, { token: b.token });
        assert.equal(opened.status, 200);
        assert.equal(opened.body.shareToken, undefined);
        const remix = await api(`/dishes/${created.body.id}/remix`, { method: 'POST', token: b.token, body: { name: 'Salmon remix', visibility: 'private' } });
        assert.equal(remix.status, 201);
        assert.equal(remix.body.parentDishId, created.body.id);
        assert.equal(remix.body.ownerId, b.id);
        assert.equal(remix.body.visibility, 'private');
        const renamed = await api(`/dishes/${remix.body.id}`, { method: 'PATCH', token: b.token, body: { name: 'Salmon remix edited' } });
        assert.equal(renamed.body.parentDishId, created.body.id);
        const original = await api(`/dishes/public/${created.body.id}`);
        assert.equal(original.body.name, 'Shareable salmon');
        const foreignParent = await api('/dishes', { method: 'POST', token: a.token, body: { name: 'Bad parent', visibility: 'private', items, parentDishId: remix.body.id } });
        assert.equal(foreignParent.status, 400);
        assert.equal(foreignParent.body.code, 'INVALID_PARENT_DISH');
    });

    it('stores a version per write and rejects the fourth private dish and a stale concurrent write', async () => {
        const a = await signup('limits');
        const first = await api('/dishes', { method: 'POST', token: a.token, body: { name: 'Versioned', visibility: 'private', items } });
        assert.equal(first.status, 201);
        const updated = await api(`/dishes/${first.body.id}`, { method: 'PATCH', token: a.token, body: { name: 'Versioned 2', items: [...items, { ingredientId: 'avocado', grams: 40, preparationId: 'raw' }] } });
        assert.equal(updated.status, 200);
        const versions = await sql`select version_number from public.dish_versions where dish_id = ${first.body.id}::uuid order by version_number`;
        assert.deepEqual(versions.map(row => row.version_number), [1, 2]);
        let pending;
        await sql.begin(async (tx) => {
            await tx`select id from public.dishes where id = ${first.body.id}::uuid for update`;
            pending = Promise.all([
                api(`/dishes/${first.body.id}`, { method: 'PATCH', token: a.token, body: { name: 'Left' } }),
                api(`/dishes/${first.body.id}`, { method: 'PATCH', token: a.token, body: { name: 'Right' } }),
            ]);
            await new Promise(resolve => setTimeout(resolve, 500));
        });
        const conflict = await pending;
        const statuses = conflict.map(result => result.status).sort();
        assert.deepEqual(statuses, [200, 409]);
        assert.equal(conflict.find(result => result.status === 409)?.body.code, 'DISH_UPDATE_CONFLICT');
        for (const name of ['Two', 'Three'])
            assert.equal((await api('/dishes', { method: 'POST', token: a.token, body: { name, visibility: 'private', items } })).status, 201);
        const fourth = await api('/dishes', { method: 'POST', token: a.token, body: { name: 'Four', visibility: 'private', items } });
        assert.equal(fourth.status, 409);
        assert.equal(fourth.body.code, 'FREE_PRIVATE_DISH_LIMIT_REACHED');
        const removed = await api(`/dishes/${first.body.id}`, { method: 'DELETE', token: a.token });
        assert.equal(removed.status, 204);
        assert.equal((await api(`/dishes/me/${first.body.id}`, { token: a.token })).status, 404);
        const versionsLeft = await sql`select count(*)::int as n from public.dish_versions where dish_id = ${first.body.id}::uuid`;
        assert.equal(versionsLeft[0].n, 0);
    });

    it('denies the anon and authenticated database roles direct product-table access', async () => {
        for (const role of ['anon', 'authenticated']) {
            await assert.rejects(sql.begin(async (tx) => {
                await tx.unsafe(`set local role ${role}`);
                await tx.unsafe('select id from public.dishes');
            }), /permission denied/);
        }
    });

    it('keeps catalogue rows unreviewed and rejects a reviewed row without attribution', async () => {
        const counts = await sql`select
          (select count(*)::int from public.ingredients) as ingredients,
          (select count(*)::int from public.ingredients where review_status = 'unreviewed' and reviewer is null and last_reviewed_at is null) as unreviewed_ingredients,
          (select count(*)::int from public.preparation_methods where review_status = 'unreviewed') as preparations,
          (select count(*)::int from public.ingredient_pairings where review_status = 'unreviewed') as pairings`;
        assert.equal(counts[0].ingredients, 620);
        assert.equal(counts[0].unreviewed_ingredients, 620);
        assert.equal(counts[0].preparations, 12);
        assert.equal(counts[0].pairings, 64);
        await assert.rejects(sql`update public.ingredients set review_status = 'reviewed' where id = 'rosemary'`, /ingredients_reviewed_requires_attribution/);
        await sql.begin(async (tx) => {
            await tx`update public.ingredients set review_status = 'reviewed', reviewer = 'reviewer', source = 'recorded source', last_reviewed_at = now() where id = 'rosemary'`;
            throw new Error('rollback-review-probe');
        }).catch(error => assert.equal(error.message, 'rollback-review-probe'));
        const rosemary = await sql`select review_status from public.ingredients where id = 'rosemary'`;
        assert.equal(rosemary[0].review_status, 'unreviewed');
    });

    it('stores USDA identity citations with empty sensory fields', async () => {
        const counts = await sql`select count(*)::int as n,
          count(*) filter (where review_status = 'unreviewed' and reviewer is null and confidence = 0 and sensory_profile is null and preparation_effects is null and recommended_range is null and pairing_evidence is null and source_license = 'CC0-1.0')::int as cited
          from public.ingredient_identities`;
        assert.equal(counts[0].n, 619);
        assert.equal(counts[0].cited, 619);
        await assert.rejects(sql`update public.ingredient_identities set sensory_profile = '{}'::jsonb where id = 'salt'`, /ingredient_identities_sensory_unfilled/);
        await assert.rejects(sql.begin(async (tx) => {
            await tx.unsafe('set local role authenticated');
            await tx`insert into public.ingredient_identities(id,name_en,name_uk,fdc_id,fdc_description,fdc_data_type,dataset,source,source_url,source_license,license_url,model_version) values('fake','Fake','Фейк',1,'x','foundation_food','x','x','https://example.invalid','CC0-1.0','https://example.invalid','x')`;
        }), /permission denied/);
    });

    it('stores nutrient hypotheses without using them as sensory measurements', async () => {
        const counts = await sql`select count(*)::int as n,
          count(*) filter (where review_status = 'unreviewed' and confidence = 0 and formula = 'nutrient-proxy-1')::int as hypotheses
          from public.ingredient_nutrient_hypotheses`;
        assert.equal(counts[0].n, 619);
        assert.equal(counts[0].hypotheses, 619);
        const samples = await sql`select identity_id, saltiness, fat_score, sweetness from public.ingredient_nutrient_hypotheses where identity_id in ('salt', 'honey', 'olive_oil')`;
        const byId = Object.fromEntries(samples.map(row => [row.identity_id, row]));
        assert.ok(Number(byId.salt.saltiness) > 9);
        assert.equal(byId.salt.fat_score, null);
        assert.ok(Number(byId.honey.sweetness) > 8);
        assert.ok(Number(byId.olive_oil.fat_score) > 9);
        await assert.rejects(sql`update public.ingredient_nutrient_hypotheses set saltiness = null where identity_id = 'salt'`, /hypotheses_saltiness_follows_sodium/);
        const scoring = await sql`select count(*)::int as n from public.ingredients`;
        assert.equal(scoring[0].n, 620);
    });
});
