-- Additive: preserve ownership, publication and existing recipes.
begin;
create or replace function public.valid_recipe_steps(value jsonb) returns boolean
language sql immutable set search_path = public as $$
 select case when jsonb_typeof(value) <> 'array' then false else
 jsonb_array_length(value) <= 40 and not exists (
 select 1 from jsonb_array_elements(value) s where jsonb_typeof(s) <> 'object'
 or jsonb_typeof(s->'id') is distinct from 'string' or jsonb_typeof(s->'text') is distinct from 'string'
 or coalesce(s->>'id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 or char_length(s->>'text') > 4000
 ) and (select count(distinct lower(s->>'id')) from jsonb_array_elements(value) s)=jsonb_array_length(value) end;
$$;
alter table public.dishes add column if not exists servings integer;
alter table public.dishes add column if not exists steps jsonb not null default '[]'::jsonb;
do $$ begin
 if not exists(select 1 from pg_constraint where conrelid='public.dishes'::regclass and conname='dishes_recipe_content_valid') then
 alter table public.dishes add constraint dishes_recipe_content_valid check ((servings is null or servings between 1 and 1000) and public.valid_recipe_steps(steps));
 end if;
end $$;
create table if not exists public.ai_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 request_id uuid not null, content_hash text not null, feature text not null check(feature in ('explain','step','full')),
 model text not null, prompt_version text not null, status text not null check(status in ('reserved','succeeded','failed','unknown')),
 units integer not null check(units between 0 and 4), reserved_microusd integer not null check(reserved_microusd>=0),
 charged_microusd integer not null default 0 check(charged_microusd>=0), input_tokens integer, output_tokens integer,
 reasoning_tokens integer, duration_ms integer, created_at timestamptz not null default now(), expires_at timestamptz not null,
 unique(user_id,request_id)
);
create index if not exists ai_requests_user_period_idx on public.ai_requests(user_id,created_at);
create index if not exists ai_requests_period_idx on public.ai_requests(created_at);
create table if not exists public.ai_response_cache (
 request_id uuid primary key references public.ai_requests(id) on delete cascade,
 response jsonb not null, expires_at timestamptz not null
);
alter table public.ai_requests enable row level security;
alter table public.ai_response_cache enable row level security;
revoke all on public.ai_requests,public.ai_response_cache from public,anon,authenticated;
commit;
