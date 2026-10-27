-- NOVATEK atomic monthly comparison quota (V98.30)
-- Execute only through the service role; never expose this RPC to anon/authenticated.
create or replace function public.consume_comparison_quota(
  p_user_id uuid,
  p_limit integer default 10
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.comparison_usage%rowtype;
  v_now timestamptz := now();
  v_reset timestamptz := ((date_trunc('month', timezone('utc', now())) + interval '1 month') at time zone 'UTC');
  v_used integer;
  v_limit integer := greatest(1, least(coalesce(p_limit, 10), 10));
  v_allowed boolean := true;
begin
  if p_user_id is null then
    raise exception 'user id is required';
  end if;

  -- The unique user_id constraint serializes concurrent reservations for one user.
  insert into public.comparison_usage(user_id, comparison_count, free_limit, reset_at)
  values (p_user_id, 0, v_limit, v_reset)
  on conflict (user_id) do nothing;

  select * into v_row
  from public.comparison_usage
  where user_id = p_user_id
  for update;

  if v_row.reset_at is null or v_row.reset_at <= v_now then
    v_row.comparison_count := 0;
    v_row.reset_at := v_reset;
  end if;

  v_used := greatest(0, coalesce(v_row.comparison_count, 0));
  if v_used >= v_limit then
    v_allowed := false;
  else
    v_used := v_used + 1;
  end if;

  update public.comparison_usage
  set comparison_count = v_used,
      free_limit = v_limit,
      reset_at = v_row.reset_at
  where user_id = p_user_id;

  return jsonb_build_object(
    'allowed', v_allowed,
    'used', v_used,
    'remaining', greatest(0, v_limit - v_used),
    'limit', v_limit,
    'resetAt', v_row.reset_at
  );
end;
$$;

revoke all on function public.consume_comparison_quota(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_comparison_quota(uuid, integer) to service_role;
notify pgrst, 'reload schema';
