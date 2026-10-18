import 'reflect-metadata';
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { resetTestDatabase } from './reset-database.mjs';
import { startAuthStub } from './auth-stub.mjs';
import { analyzeDish, MODEL_VERSION, CATALOGUE_VERSION } from '@flavorpilot/flavor-engine';

const databaseUrl = process.env.FLAVORPILOT_TEST_DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:54329/flavorpilot_test';
process.env.DATABASE_URL = databaseUrl;
process.env.DATABASE_SSL = 'disable';
process.env.NODE_ENV = 'test';
process.env.AI_ENABLED = 'false';
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
