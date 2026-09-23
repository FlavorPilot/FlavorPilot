-- Existing databases only. Do not rerun supabase/schema.sql.
-- Nutrient-density hypotheses. They do not change scoring coefficients.
begin;
create table if not exists public.ingredient_nutrient_hypotheses (
 identity_id text primary key references public.ingredient_identities(id),
 formula text not null check (formula='nutrient-proxy-1'),
 sodium_mg numeric,sodium_nutrient_id integer,fat_g numeric,fat_nutrient_id integer,sugars_g numeric,sugars_nutrient_id integer,water_g numeric,water_nutrient_id integer,
 saltiness numeric,fat_score numeric,sweetness numeric,moisture numeric,
 reviewer text,review_status text not null default 'unreviewed' check (review_status in ('unreviewed','in_review','reviewed','rejected')),
 confidence numeric(4,3) not null default 0 check (confidence between 0 and 1),source_license text not null,
 last_reviewed_at timestamptz,
 constraint ingredient_nutrient_hypotheses_reviewed_requires_attribution check (review_status<>'reviewed' or (reviewer is not null and char_length(btrim(reviewer))>=2 and last_reviewed_at is not null)),
 constraint hypotheses_saltiness_follows_sodium check ((saltiness is null)=(sodium_mg is null)),
 constraint hypotheses_fat_follows_amount check ((fat_score is null)=(fat_g is null)),
 constraint hypotheses_sweetness_follows_sugars check ((sweetness is null)=(sugars_g is null)),
 constraint hypotheses_moisture_follows_water check ((moisture is null)=(water_g is null)),
 constraint hypotheses_scores_bounded check ((saltiness is null or saltiness between 0 and 10) and (fat_score is null or fat_score between 0 and 10) and (sweetness is null or sweetness between 0 and 10) and (moisture is null or moisture between 0 and 10))
);
alter table public.ingredient_nutrient_hypotheses enable row level security;
do $$ begin
 create policy "Nutrient hypotheses are public" on public.ingredient_nutrient_hypotheses for select using(true);
exception when duplicate_object then null; end $$;
revoke insert,update,delete,truncate on public.ingredient_nutrient_hypotheses from anon,authenticated;
commit;
