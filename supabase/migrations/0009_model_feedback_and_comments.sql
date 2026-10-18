-- Existing databases: apply after 0008. Additive; no recipe publication or score changes.
begin;
create table if not exists public.model_feedback (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id) on delete cascade,
 dish_id uuid references public.dishes(id) on delete set null, dish_version_number integer check(dish_version_number > 0),
 snapshot_key text not null check(char_length(snapshot_key)=64), recipe_snapshot jsonb not null, analysis_snapshot jsonb not null,
 model_version text not null, catalogue_version text not null, cooked boolean not null,
 agreement text not null check(agreement in ('matches','partial','missed')),
 concerns jsonb not null default '[]'::jsonb check(jsonb_typeof(concerns)='array' and jsonb_array_length(concerns)<=4),
 note text not null default '' check(char_length(note)<=2000), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint model_feedback_concerns_valid check(concerns <@ '["compatibility","balance","quantity","texture"]'::jsonb),
 constraint model_feedback_matches_no_concerns check(agreement<>'matches' or concerns='[]'::jsonb)
);
create unique index if not exists model_feedback_author_snapshot_idx on public.model_feedback(author_id,snapshot_key);
create table if not exists public.dish_comments (
 id uuid primary key default gen_random_uuid(), dish_id uuid not null references public.dishes(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 parent_id uuid references public.dish_comments(id) on delete set null,
 body text, has_cooked boolean not null default false, version_number integer not null check(version_number>0),
 created_at timestamptz(3) not null default now(), deleted_at timestamptz,
 constraint dish_comments_body_valid check((deleted_at is null and body is not null and char_length(btrim(body)) between 1 and 2000) or (deleted_at is not null and body is null)),
 constraint dish_comments_not_self_reply check(parent_id is null or parent_id<>id)
);
create index if not exists dish_comments_page_idx on public.dish_comments(dish_id,created_at desc,id desc);
create or replace function public.validate_comment_parent() returns trigger language plpgsql set search_path=public as $$
begin
 if new.parent_id is not null and not exists(select 1 from public.dish_comments p where p.id=new.parent_id and p.dish_id=new.dish_id and p.parent_id is null) then
  raise exception 'INVALID_COMMENT_PARENT' using errcode='P0001';
 end if;
 return new;
end;$$;
drop trigger if exists dish_comments_validate_parent on public.dish_comments;
create trigger dish_comments_validate_parent before insert or update of parent_id,dish_id on public.dish_comments for each row execute function public.validate_comment_parent();
alter table public.model_feedback enable row level security;
alter table public.dish_comments enable row level security;
-- Nest validates authentication, ownership and current visibility. No second writable REST path.
revoke all on public.model_feedback,public.dish_comments from public,anon,authenticated;
commit;
