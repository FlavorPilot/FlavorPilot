import 'reflect-metadata';
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import postgres from 'postgres';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { resetTestDatabase } from './reset-database.mjs';
import { startAuthStub } from './auth-stub.mjs';

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
});
