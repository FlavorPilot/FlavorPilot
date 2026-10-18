-- Internal trigger functions are invoked by PostgreSQL, not by public RPC clients.
-- Additive hardening: no recipe, account, ownership or visibility changes.
begin;
alter function public.set_updated_at() set search_path = public;
alter function public.normalize_dish_publication() set search_path = public;
revoke execute on function public.enforce_private_dish_limit(),
  public.handle_new_user(), public.preserve_dish_parent_lineage(),
  public.validate_dish_item_catalog(), public.validate_dish_parent()
  from public, anon, authenticated;
commit;
