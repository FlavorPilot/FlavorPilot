-- Additive display metadata. Existing grams remain authoritative; no data rewrite or grant change.
begin;
alter table public.dish_items add column if not exists input_unit text;
alter table public.dish_items add column if not exists input_quantity numeric;
alter table public.dish_items add column if not exists input_grams_per_unit numeric;
do $$ begin
 if not exists (select 1 from pg_constraint where conrelid='public.dish_items'::regclass and conname='dish_items_input_amount_check') then
  alter table public.dish_items add constraint dish_items_input_amount_check check (
   (input_unit is null and input_quantity is null and input_grams_per_unit is null) or
   (input_unit is not null and input_quantity is not null and input_grams_per_unit is not null and input_unit in ('piece','ml') and input_quantity>0 and input_quantity<=1000000 and input_grams_per_unit>0 and input_grams_per_unit<=1000000000 and abs(grams-round(input_quantity*input_grams_per_unit,3))<=0.001)
  );
 end if;
end $$;
commit;
