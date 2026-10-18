-- Existing installations: apply after 0009. Does not grant an owner or expose old feedback.
begin;
alter table public.dishes add column if not exists moderation_hidden boolean not null default false;
alter table public.dishes add column if not exists moderation_revision integer not null default 0 check(moderation_revision>=0);
alter table public.model_feedback add column if not exists allow_team_review boolean not null default false;
create table if not exists public.admin_memberships (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 role text not null default 'owner' check(role='owner'),active boolean not null default true,created_at timestamptz not null default now()
);
create table if not exists public.admin_audit_events (
 id uuid primary key default gen_random_uuid(),actor_id uuid references public.profiles(id) on delete set null,
 action text not null check(char_length(action) between 1 and 80),target_id text,
 reason text check(reason is null or char_length(reason)<=500),created_at timestamptz not null default now()
);
create index if not exists admin_audit_page_idx on public.admin_audit_events(created_at desc,id desc);
create table if not exists public.feedback_reviews (
 feedback_id uuid primary key references public.model_feedback(id) on delete cascade,
 status text not null default 'new' check(status in ('new','reviewing','needs_check','closed')),
 note text not null default '' check(char_length(note)<=2000),revision integer not null default 1 check(revision>0),
 updated_by uuid references public.profiles(id) on delete set null,updated_at timestamptz not null default now()
);
create table if not exists public.support_tickets (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.profiles(id) on delete cascade,
 request_id uuid not null,subject text not null check(char_length(btrim(subject)) between 3 and 160),
 category text not null check(category in ('account','recipe','model','billing','other')),
 status text not null default 'new' check(status in ('new','working','waiting_user','waiting_fix','resolved','closed')),
 priority text not null default 'normal' check(priority in ('normal','high')),
 assigned_to uuid references public.profiles(id) on delete set null,revision integer not null default 0 check(revision>=0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index if not exists support_tickets_request_idx on public.support_tickets(owner_id,request_id);
create index if not exists support_tickets_owner_idx on public.support_tickets(owner_id,created_at desc,id desc);
create table if not exists public.support_messages (
 id uuid primary key default gen_random_uuid(),ticket_id uuid not null references public.support_tickets(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,request_id uuid not null,
 body text not null check(char_length(btrim(body)) between 1 and 4000),from_staff boolean not null default false,
 created_at timestamptz not null default now()
);
create unique index if not exists support_messages_request_idx on public.support_messages(ticket_id,author_id,request_id);
create index if not exists support_messages_ticket_idx on public.support_messages(ticket_id,created_at,id);
alter table public.admin_memberships enable row level security;
alter table public.admin_audit_events enable row level security;
alter table public.feedback_reviews enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
revoke all on public.admin_memberships,public.admin_audit_events,public.feedback_reviews,public.support_tickets,public.support_messages from public,anon,authenticated;
commit;
