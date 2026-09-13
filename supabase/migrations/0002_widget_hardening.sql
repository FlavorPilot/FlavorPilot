-- Existing v0.3 Supabase schema only. Back up and test in staging before applying.
-- No data deletion. Nest must use its trusted database role, not anon/authenticated.
begin;
create or replace function public.enforce_private_dish_limit() returns trigger language plpgsql security definer set search_path=public as $$
declare current_tier public.subscription_tier;current_status text;period_end timestamptz;private_count integer;
begin
 if new.visibility<>'private' then return new;end if;
 -- Rebuild r2: edits cannot force an existing private recipe to become public after a downgrade.
 if tg_op='UPDATE' then
  if old.visibility='private' and old.owner_id=new.owner_id then return new;end if;
 end if;
 -- Serialize capacity checks per owner, including direct database writers.
 perform 1 from public.profiles where id=new.owner_id for update;
 select s.tier,s.status,s.current_period_end into current_tier,current_status,period_end from public.subscriptions s where s.user_id=new.owner_id;
 if coalesce(current_tier,'free')<>'free' and coalesce(current_status,'inactive') in ('active','trialing') and (period_end is null or period_end>now()) then return new;end if;
 select count(*) into private_count from public.dishes d where d.owner_id=new.owner_id and d.visibility='private' and d.id<>new.id;
 if private_count>=3 then raise exception 'FREE_PRIVATE_DISH_LIMIT_REACHED' using errcode='P0001';end if;
 return new;
end;$$;

revoke all on public.dishes,public.dish_items,public.dish_versions,public.favorites,public.subscriptions from anon,authenticated;
revoke execute on function public.get_shared_dish(uuid) from public,anon,authenticated;
commit;
