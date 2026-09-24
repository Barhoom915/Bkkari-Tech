-- NOVATEK V84 — wallet/idempotency hardening
-- Run after the existing NOVATEK/Supabase migrations.

-- Prevent duplicate wallet purchase references at the database level.
create unique index if not exists wallet_purchase_reference_unique_v84
on public.wallet_transactions(user_id, reference)
where type = 'purchase' and reference is not null;

-- Idempotent digital-service wallet debit. A repeated reference is treated as
-- already debited instead of charging the wallet again.
create or replace function public.debit_wallet_for_service(
  p_user_id uuid,
  p_amount numeric,
  p_reference text
)
returns table(ok boolean,message text,new_balance numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  b numeric := 0;
  existing_amount numeric;
begin
  if p_user_id is null or p_amount is null or p_amount < 0 or nullif(trim(p_reference),'') is null then
    return query select false,'بيانات الخصم غير صحيحة',0::numeric;
    return;
  end if;

  select amount into existing_amount
  from wallet_transactions
  where user_id = p_user_id
    and type = 'purchase'
    and reference = trim(p_reference)
  limit 1;

  if existing_amount is not null then
    if round(abs(existing_amount),2) <> round(p_amount,2) then
      return query select false,'مرجع العملية مستخدم بمبلغ مختلف',coalesce((select balance from wallets where user_id=p_user_id),0);
      return;
    end if;
    select balance into b from wallets where user_id=p_user_id;
    return query select true,'تم تنفيذ الخصم مسبقاً',coalesce(b,0);
    return;
  end if;

  select balance into b from wallets where user_id = p_user_id for update;
  b := coalesce(b,0);
  if b < p_amount then
    return query select false,'رصيد المحفظة غير كافي',b;
    return;
  end if;

  update wallets
  set balance = balance - p_amount, updated_at = now()
  where user_id = p_user_id;

  insert into wallet_transactions(user_id,amount,type,status,reference)
  values(p_user_id,-round(p_amount,2),'purchase','pending',trim(p_reference));

  select balance into b from wallets where user_id=p_user_id;
  return query select true,'تم الخصم',coalesce(b,0);
exception when unique_violation then
  select balance into b from wallets where user_id=p_user_id;
  return query select true,'تم تنفيذ الخصم مسبقاً',coalesce(b,0);
end;
$$;

revoke all on function public.debit_wallet_for_service(uuid,numeric,text) from public;
grant execute on function public.debit_wallet_for_service(uuid,numeric,text) to service_role;

-- Digital order idempotency must survive concurrent requests.
alter table public.digital_service_orders
  add column if not exists client_request_id uuid;
create unique index if not exists digital_service_orders_client_request_v84
on public.digital_service_orders(client_request_id)
where client_request_id is not null;
