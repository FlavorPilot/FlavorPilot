-- Additive guest identity and a non-renewing test allowance, separate from paid periods.
begin;
create table if not exists public.ai_guest_sessions (
 id uuid primary key default gen_random_uuid(),
 token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now()
);
create index if not exists ai_guest_sessions_created_idx on public.ai_guest_sessions(created_at);
alter table public.ai_guest_sessions enable row level security;
revoke all on public.ai_guest_sessions from public,anon,authenticated;
alter table public.ai_requests alter column user_id drop not null;
alter table public.ai_requests add column if not exists guest_id uuid references public.ai_guest_sessions(id) on delete cascade;
alter table public.ai_requests add column if not exists test_access boolean not null default false;
do $$ begin
 if not exists(select 1 from pg_constraint where conrelid='public.ai_requests'::regclass and conname='ai_requests_actor_check') then
 alter table public.ai_requests add constraint ai_requests_actor_check check ((user_id is not null)::int+(guest_id is not null)::int=1);
 end if;
end $$;
create unique index if not exists ai_requests_guest_request_idx on public.ai_requests(guest_id,request_id) where guest_id is not null;
create index if not exists ai_requests_guest_period_idx on public.ai_requests(guest_id,created_at) where guest_id is not null;
commit;
