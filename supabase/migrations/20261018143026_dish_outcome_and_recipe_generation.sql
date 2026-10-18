-- Expand the accounting feature enum; preserve reservations, cache, grants and RLS.
begin;
alter table public.ai_requests drop constraint if exists ai_requests_feature_check;
alter table public.ai_requests add constraint ai_requests_feature_check check(feature in ('explain','step','full','generate'));
commit;
