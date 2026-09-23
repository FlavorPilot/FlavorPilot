import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

export function assertTestDatabase(databaseUrl) {
    const parsed = new URL(databaseUrl);
    const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (!local || parsed.pathname !== '/flavorpilot_test')
        throw new Error('Refusing to reset a database that is not local flavorpilot_test');
}

export async function resetTestDatabase(databaseUrl) {
    assertTestDatabase(databaseUrl);
    const sql = postgres(databaseUrl, { max: 1, prepare: false, ssl: false, onnotice() { } });
    try {
        await sql`select pg_terminate_backend(pid) from pg_stat_activity where datname = current_database() and pid <> pg_backend_pid()`;
        await sql.unsafe(`
      drop schema if exists public cascade;
      drop schema if exists auth cascade;
      create schema public;
      create extension if not exists pgcrypto;
      do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
      do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
      do $$ begin create role service_role nologin; exception when duplicate_object then null; end $$;
      create schema auth;
      create table auth.users (
        id uuid primary key default gen_random_uuid(),
        email text unique,
        raw_user_meta_data jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now()
      );
      create or replace function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
    `);
        await sql.unsafe(readFileSync(path.join(root, 'supabase/schema.sql'), 'utf8'));
        await sql.unsafe(readFileSync(path.join(root, 'supabase/seed.sql'), 'utf8'));
        await sql.unsafe(readFileSync(path.join(root, 'supabase/seed-identities.sql'), 'utf8'));
    }
    finally {
        await sql.end();
    }
}
