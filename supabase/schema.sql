-- FlavorPilot PostgreSQL/Supabase schema for the NestJS API
-- Run in a fresh Supabase project through the SQL editor.

create extension if not exists pgcrypto;

create type public.dish_visibility as enum ('public', 'unlisted', 'private');
create type public.subscription_tier as enum ('free', 'pro', 'studio', 'kitchen');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 32),
  display_name text,
  bio text,
  avatar_url text,
  locale text not null default 'en' check (locale in ('en', 'uk')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingredients (
  id text primary key,
  name_en text not null,
  name_uk text not null,
  category_en text not null,
  category_uk text not null,
  sensory_profile jsonb not null,
  intensity numeric(4,2) not null check (intensity between 0 and 10),
  texture_intensity numeric(4,2) not null check (texture_intensity between 0 and 10),
  aromas text[] not null default '{}',
  textures text[] not null default '{}',
  roles text[] not null default '{}',
  min_share numeric(6,2) not null,
  ideal_share numeric(6,2) not null,
  max_share numeric(6,2) not null,
  preparation_ids text[] not null default '{}',
  source_note text,
  confidence numeric(4,3) not null default 0.6 check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.preparation_methods (
  id text primary key,
  name_en text not null,
  name_uk text not null,
  profile_multiplier jsonb not null default '{}',
  intensity_multiplier numeric(5,3) not null default 1,
  add_aromas text[] not null default '{}',
  add_textures text[] not null default '{}'
);

create table public.ingredient_pairings (
  ingredient_a_id text not null references public.ingredients(id) on delete cascade,
  ingredient_b_id text not null references public.ingredients(id) on delete cascade,
  explicit_adjustment numeric(6,2) not null default 0,
  confidence numeric(4,3) not null default 0.6 check (confidence between 0 and 1),
  source_note text,
  created_at timestamptz not null default now(),
  primary key (ingredient_a_id, ingredient_b_id),
  check (ingredient_a_id < ingredient_b_id)
);

create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  goal text not null default 'balanced' check (goal in ('balanced', 'fresh', 'rich', 'spicy', 'sweetSour', 'smoky', 'umami', 'light', 'creamy', 'crunchy')),
  visibility public.dish_visibility not null default 'private',
  share_token uuid not null default gen_random_uuid(),
  parent_dish_id uuid references public.dishes(id) on delete set null,
  description text check (description is null or char_length(description) <= 4000),
  image_url text check (image_url is null or char_length(image_url) <= 2048),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dish_items (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes(id) on delete cascade,
  ingredient_id text not null references public.ingredients(id),
  grams numeric(10,3) not null check (grams > 0 and grams <= 5000),
  preparation_id text not null references public.preparation_methods(id),
  position smallint not null default 0 check (position >= 0),
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create table public.dish_versions (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  snapshot jsonb not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (dish_id, version_number)
);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  dish_id uuid not null references public.dishes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, dish_id)
);

create table public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  tier public.subscription_tier not null default 'free',
  provider_customer_id text,
  provider_subscription_id text,
  status text not null default 'inactive' check (status in ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index dishes_owner_idx on public.dishes(owner_id, updated_at desc);
create index dishes_public_idx on public.dishes(published_at desc) where visibility = 'public';
create index dishes_parent_idx on public.dishes(parent_dish_id);
create unique index dishes_share_token_idx on public.dishes(share_token);
create index dish_items_dish_idx on public.dish_items(dish_id, position);
create index favorites_dish_idx on public.favorites(dish_id);
create unique index dish_items_unique_ingredient_idx
  on public.dish_items(dish_id, ingredient_id, preparation_id);

create or replace function public.validate_dish_item_catalog()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.ingredients i
    where i.id = new.ingredient_id
      and new.preparation_id = any(i.preparation_ids)
  ) then
    raise exception 'UNSUPPORTED_DISH_ITEM' using errcode = 'P0001';
  end if;

  -- Serialize inserts per dish so the limit remains reliable for concurrent writers.
  if tg_op = 'INSERT' then
    perform 1 from public.dishes d where d.id = new.dish_id for update;
    if (select count(*) from public.dish_items di where di.dish_id = new.dish_id) >= 24 then
      raise exception 'DISH_ITEM_LIMIT_REACHED' using errcode = 'P0001';
    end if;
  elsif new.dish_id is distinct from old.dish_id then
    perform 1 from public.dishes d where d.id = new.dish_id for update;
    if (select count(*) from public.dish_items di where di.dish_id = new.dish_id) >= 24 then
      raise exception 'DISH_ITEM_LIMIT_REACHED' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger dish_items_validate_catalog
before insert or update of dish_id, ingredient_id, preparation_id on public.dish_items
for each row execute function public.validate_dish_item_catalog();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger ingredients_set_updated_at
before update on public.ingredients
for each row execute function public.set_updated_at();

create trigger dishes_set_updated_at
before update on public.dishes
for each row execute function public.set_updated_at();

create or replace function public.normalize_dish_publication()
returns trigger
language plpgsql
as $$
begin
  if new.visibility = 'public' then
    if tg_op = 'INSERT' then
      new.published_at := now();
    elsif old.visibility is distinct from 'public' then
      new.published_at := now();
    else
      new.published_at := old.published_at;
    end if;
  else
    new.published_at := null;
  end if;
  return new;
end;
$$;

create trigger dishes_normalize_publication
before insert or update of visibility, published_at on public.dishes
for each row execute function public.normalize_dish_publication();

create or replace function public.validate_dish_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.parent_dish_id is null then
    return new;
  end if;

  if new.parent_dish_id = new.id then
    raise exception 'INVALID_PARENT_DISH' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.dishes parent
    where parent.id = new.parent_dish_id
      and (parent.visibility = 'public' or parent.owner_id = new.owner_id)
  ) then
    raise exception 'INVALID_PARENT_DISH' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger dishes_validate_parent
before insert on public.dishes
for each row execute function public.validate_dish_parent();

create or replace function public.preserve_dish_parent_lineage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.parent_dish_id is not distinct from new.parent_dish_id then
    return new;
  end if;

  -- `on delete set null` must be able to detach a remix after its source is deleted.
  -- A normal writer cannot clear or replace attribution while the source still exists.
  if new.parent_dish_id is null
    and old.parent_dish_id is not null
    and not exists (select 1 from public.dishes parent where parent.id = old.parent_dish_id) then
    return new;
  end if;

  raise exception 'IMMUTABLE_PARENT_DISH' using errcode = 'P0001';
end;
$$;

create trigger dishes_preserve_parent_lineage
before update of parent_dish_id on public.dishes
for each row execute function public.preserve_dish_parent_lineage();

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
security definer set search_path = public
language plpgsql
as $$
declare
  requested_username text;
  base_username text;
begin
  requested_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', ''),
    '[^a-z0-9_]+',
    '',
    'g'
  ));

  if char_length(requested_username) < 3 then
    requested_username := 'chef_' || substring(new.id::text from 1 for 8);
  end if;

  base_username := left(requested_username, 23);
  if exists (select 1 from public.profiles p where p.username = base_username) then
    base_username := base_username || '_' || substring(replace(new.id::text, '-', '') from 1 for 8);
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    base_username,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), base_username)
  );

  insert into public.subscriptions (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Defense-in-depth for the Free plan: a user may keep at most three private dishes.
-- Active or trialing paid tiers bypass the limit. Keep a matching friendly check in the application UI.
create or replace function public.enforce_private_dish_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_tier public.subscription_tier;
  current_status text;
  period_end timestamptz;
  private_count integer;
begin
  if new.visibility <> 'private' then
    return new;
  end if;

  select
    coalesce(s.tier, 'free'::public.subscription_tier),
    coalesce(s.status, 'inactive'),
    s.current_period_end
  into current_tier, current_status, period_end
  from public.subscriptions s
  where s.user_id = new.owner_id;

  current_tier := coalesce(current_tier, 'free'::public.subscription_tier);
  current_status := coalesce(current_status, 'inactive');

  if current_tier <> 'free'
    and current_status in ('active', 'trialing')
    and (period_end is null or period_end > now()) then
    return new;
  end if;

  select count(*)
    into private_count
  from public.dishes d
  where d.owner_id = new.owner_id
    and d.visibility = 'private'
    and d.id <> new.id;

  if private_count >= 3 then
    raise exception 'FREE_PRIVATE_DISH_LIMIT_REACHED'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger dishes_enforce_private_limit
before insert or update of visibility, owner_id on public.dishes
for each row execute function public.enforce_private_dish_limit();

alter table public.profiles enable row level security;
alter table public.ingredients enable row level security;
alter table public.preparation_methods enable row level security;
alter table public.ingredient_pairings enable row level security;
alter table public.dishes enable row level security;
alter table public.dish_items enable row level security;
alter table public.dish_versions enable row level security;
alter table public.favorites enable row level security;
alter table public.subscriptions enable row level security;

create policy "Profiles are publicly readable"
on public.profiles for select using (true);

create policy "Users update their own profile"
on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Ingredient knowledge is public"
on public.ingredients for select using (true);

create policy "Preparation knowledge is public"
on public.preparation_methods for select using (true);

create policy "Pairing knowledge is public"
on public.ingredient_pairings for select using (true);

create policy "Public dishes or owner can read"
on public.dishes for select
using (visibility = 'public' or owner_id = auth.uid());

create policy "Owners create dishes"
on public.dishes for insert
with check (owner_id = auth.uid());

create policy "Owners update dishes"
on public.dishes for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Owners delete dishes"
on public.dishes for delete
using (owner_id = auth.uid());

create policy "Readable dish items"
on public.dish_items for select
using (
  exists (
    select 1 from public.dishes d
    where d.id = dish_items.dish_id
      and (d.visibility = 'public' or d.owner_id = auth.uid())
  )
);

create policy "Owners create dish items"
on public.dish_items for insert
with check (
  exists (
    select 1 from public.dishes d
    where d.id = dish_items.dish_id and d.owner_id = auth.uid()
  )
);

create policy "Owners update dish items"
on public.dish_items for update
using (
  exists (
    select 1 from public.dishes d
    where d.id = dish_items.dish_id and d.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.dishes d
    where d.id = dish_items.dish_id and d.owner_id = auth.uid()
  )
);

create policy "Owners delete dish items"
on public.dish_items for delete
using (
  exists (
    select 1 from public.dishes d
    where d.id = dish_items.dish_id and d.owner_id = auth.uid()
  )
);

create policy "Owners read versions"
on public.dish_versions for select
using (
  exists (
    select 1 from public.dishes d
    where d.id = dish_versions.dish_id and d.owner_id = auth.uid()
  )
);

create policy "Owners create versions"
on public.dish_versions for insert
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.dishes d
    where d.id = dish_versions.dish_id and d.owner_id = auth.uid()
  )
);

create policy "Users read own favorites"
on public.favorites for select using (user_id = auth.uid());

create policy "Users create own favorites"
on public.favorites for insert with check (user_id = auth.uid());

create policy "Users delete own favorites"
on public.favorites for delete using (user_id = auth.uid());

create policy "Users read own subscription"
on public.subscriptions for select using (user_id = auth.uid());

create or replace function public.get_shared_dish(p_share_token uuid)
returns table (
  dish jsonb,
  items jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    to_jsonb(d.*) as dish,
    coalesce(jsonb_agg(to_jsonb(di.*) order by di.position) filter (where di.id is not null), '[]'::jsonb) as items
  from public.dishes d
  left join public.dish_items di on di.dish_id = d.id
  where d.share_token = p_share_token
    and d.visibility = 'unlisted'
  group by d.id;
$$;

revoke all on function public.get_shared_dish(uuid) from public;
grant execute on function public.get_shared_dish(uuid) to anon, authenticated;
