-- NOVATEK AI usage ledger + atomic per-actor quotas (V98.29)
-- Apply to the shared Supabase project before deploying the store changes.
create table if not exists public.ai_usage_limits (
  actor_key text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  day_key date not null default (timezone('utc', now())::date),
  month_key date not null default (date_trunc('month', timezone('utc', now()))::date),
  daily_count integer not null default 0 check (daily_count >= 0),
  monthly_count integer not null default 0 check (monthly_count >= 0),
  minute_started_at timestamptz not null default now(),
  minute_count integer not null default 0 check (minute_count >= 0),
  updated_at timestamptz not null default now()
);
create index if not exists ai_usage_limits_user_id_idx on public.ai_usage_limits(user_id);
alter table public.ai_usage_limits enable row level security;
revoke all on public.ai_usage_limits from anon, authenticated;
grant select, insert, update, delete on public.ai_usage_limits to service_role;

create or replace function public.consume_ai_usage_quota(
  p_actor_key text,
  p_user_id uuid default null,
  p_daily_limit integer default 30,
  p_monthly_limit integer default 300,
  p_minute_limit integer default 6
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.ai_usage_limits%rowtype;
  v_today date := timezone('utc', now())::date;
  v_month date := date_trunc('month', timezone('utc', now()))::date;
  v_reason text := null;
begin
  if p_actor_key is null or length(p_actor_key) < 8 then
    raise exception 'invalid actor key';
  end if;
  insert into public.ai_usage_limits(actor_key, user_id, day_key, month_key)
  values (p_actor_key, p_user_id, v_today, v_month)
  on conflict (actor_key) do nothing;

  select * into v_row from public.ai_usage_limits where actor_key = p_actor_key for update;
  if v_row.day_key <> v_today then v_row.daily_count := 0; v_row.day_key := v_today; end if;
  if v_row.month_key <> v_month then v_row.monthly_count := 0; v_row.month_key := v_month; end if;
  if v_row.minute_started_at < now() - interval '1 minute' then
    v_row.minute_started_at := now();
    v_row.minute_count := 0;
  end if;

  if v_row.minute_count >= greatest(1, p_minute_limit) then v_reason := 'rate_limited';
  elsif v_row.daily_count >= greatest(1, p_daily_limit) then v_reason := 'daily_limit';
  elsif v_row.monthly_count >= greatest(1, p_monthly_limit) then v_reason := 'monthly_limit';
  else
    v_row.daily_count := v_row.daily_count + 1;
    v_row.monthly_count := v_row.monthly_count + 1;
    v_row.minute_count := v_row.minute_count + 1;
  end if;

  update public.ai_usage_limits set
    user_id = coalesce(p_user_id, user_id),
    day_key = v_row.day_key, month_key = v_row.month_key,
    daily_count = v_row.daily_count, monthly_count = v_row.monthly_count,
    minute_started_at = v_row.minute_started_at, minute_count = v_row.minute_count,
    updated_at = now()
  where actor_key = p_actor_key;

  return jsonb_build_object(
    'allowed', v_reason is null, 'reason', v_reason,
    'dailyUsed', v_row.daily_count, 'dailyLimit', greatest(1, p_daily_limit),
    'monthlyUsed', v_row.monthly_count, 'monthlyLimit', greatest(1, p_monthly_limit),
    'minuteUsed', v_row.minute_count, 'minuteLimit', greatest(1, p_minute_limit),
    'dayResetsAt', ((v_today + 1)::timestamp at time zone 'UTC'),
    'monthResetsAt', ((v_month + interval '1 month')::timestamp at time zone 'UTC')
  );
end;
$$;
revoke all on function public.consume_ai_usage_quota(text, uuid, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_usage_quota(text, uuid, integer, integer, integer) to service_role;

-- The admin analytics ledger lives in the admin repo migration V71.
-- Ensure compatible status values and useful user/date indexes if that ledger exists.
do $$
begin
  if to_regclass('public.ai_usage_events') is not null then
    execute 'create index if not exists ai_usage_events_feature_status_created_idx on public.ai_usage_events(feature, status, created_at desc)';
    execute 'create index if not exists ai_usage_events_user_feature_created_idx on public.ai_usage_events(user_id, feature, created_at desc)';
  end if;
end $$;
notify pgrst, 'reload schema';
