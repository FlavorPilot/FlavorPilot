-- Existing FlavorPilot databases only. Do not rerun supabase/schema.sql.
-- Adds review provenance. Does not change sensory numbers, shares, or pair adjustments.
-- Current rows stay unreviewed. A reviewed row must name a reviewer, a source, and a review time.
begin;
alter table public.ingredients
 add column if not exists source text,
 add column if not exists source_license text,
 add column if not exists reviewer text,
 add column if not exists review_status text not null default 'unreviewed',
 add column if not exists model_version text not null default '0.3.0-hypothesis',
 add column if not exists preparation_effect_overrides jsonb,
 add column if not exists last_reviewed_at timestamptz;
alter table public.preparation_methods
 add column if not exists source text,
 add column if not exists source_license text,
 add column if not exists reviewer text,
 add column if not exists review_status text not null default 'unreviewed',
 add column if not exists model_version text not null default '0.3.0-hypothesis',
 add column if not exists last_reviewed_at timestamptz;
alter table public.ingredient_pairings
 add column if not exists source text,
 add column if not exists source_license text,
 add column if not exists reviewer text,
 add column if not exists review_status text not null default 'unreviewed',
 add column if not exists model_version text not null default '0.3.0-hypothesis',
 add column if not exists last_reviewed_at timestamptz;
do $$ begin
 alter table public.ingredients add constraint ingredients_review_status_check check (review_status in ('unreviewed','in_review','reviewed','rejected'));
exception when duplicate_object then null; end $$;
do $$ begin
 alter table public.ingredients add constraint ingredients_reviewed_requires_attribution check (review_status<>'reviewed' or (reviewer is not null and char_length(btrim(reviewer))>=2 and last_reviewed_at is not null and source is not null and char_length(btrim(source))>=3));
exception when duplicate_object then null; end $$;
do $$ begin
 alter table public.preparation_methods add constraint preparation_methods_review_status_check check (review_status in ('unreviewed','in_review','reviewed','rejected'));
exception when duplicate_object then null; end $$;
do $$ begin
 alter table public.preparation_methods add constraint preparation_methods_reviewed_requires_attribution check (review_status<>'reviewed' or (reviewer is not null and char_length(btrim(reviewer))>=2 and last_reviewed_at is not null and source is not null and char_length(btrim(source))>=3));
exception when duplicate_object then null; end $$;
do $$ begin
 alter table public.ingredient_pairings add constraint ingredient_pairings_review_status_check check (review_status in ('unreviewed','in_review','reviewed','rejected'));
exception when duplicate_object then null; end $$;
do $$ begin
 alter table public.ingredient_pairings add constraint ingredient_pairings_reviewed_requires_attribution check (review_status<>'reviewed' or (reviewer is not null and char_length(btrim(reviewer))>=2 and last_reviewed_at is not null and source is not null and char_length(btrim(source))>=3));
exception when duplicate_object then null; end $$;
commit;
