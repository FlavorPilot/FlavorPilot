-- Existing databases only. Do not rerun supabase/schema.sql.
-- Identity citations from USDA FoodData Central. Sensory columns stay empty.
begin;
create table if not exists public.ingredient_identities (
 id text primary key,catalog_ingredient_id text,name_en text not null,name_uk text not null,
 name_uk_origin text not null default 'project-translation' check (name_uk_origin='project-translation'),
 fdc_id integer not null unique,fdc_description text not null,
 fdc_data_type text not null check (fdc_data_type in ('foundation_food','sr_legacy_food')),
 fdc_food_category text,fdc_publication_date date,dataset text not null,source text not null,source_url text not null,
 source_license text not null,license_url text not null,
 sensory_profile jsonb,preparation_effects jsonb,recommended_range jsonb,pairing_evidence jsonb,
 reviewer text,review_status text not null default 'unreviewed' check (review_status in ('unreviewed','in_review','reviewed','rejected')),
 confidence numeric(4,3) not null default 0 check (confidence between 0 and 1),model_version text not null,last_reviewed_at timestamptz,
 constraint ingredient_identities_reviewed_requires_attribution check (review_status<>'reviewed' or (reviewer is not null and char_length(btrim(reviewer))>=2 and last_reviewed_at is not null and source is not null and char_length(btrim(source))>=3)),
 constraint ingredient_identities_sensory_unfilled check (sensory_profile is null and preparation_effects is null and recommended_range is null and pairing_evidence is null)
);
alter table public.ingredient_identities enable row level security;
do $$ begin
 create policy "Identity citations are public" on public.ingredient_identities for select using(true);
exception when duplicate_object then null; end $$;
revoke insert,update,delete,truncate on public.ingredient_identities from anon,authenticated;
commit;
