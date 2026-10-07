-- NOVATEK V98.20: 10 smart comparisons per account per month
alter table public.comparison_usage alter column free_limit set default 10;
update public.comparison_usage set free_limit = 10;
update public.comparison_usage set reset_at = date_trunc('month', now()) + interval '1 month' where reset_at is null or reset_at < date_trunc('month', now());

-- Keep quota account-based. The server validates the authenticated Supabase user before consuming a comparison.
create index if not exists comparison_usage_user_id_idx on public.comparison_usage(user_id);
notify pgrst, 'reload schema';
