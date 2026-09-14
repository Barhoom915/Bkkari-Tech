-- Bkkari Tech V19: secure wallet checkout + direct wallet top-up contact mode

-- Keep payment methods limited to wallet or cash on delivery.
alter table orders add column if not exists payment_method text default 'cash';
alter table orders drop constraint if exists orders_payment_method_check;
alter table orders add constraint orders_payment_method_check check (payment_method in ('wallet','cash'));

create or replace function create_order_with_wallet(
  p_order_number text,
  p_customer_name text,
  p_customer_phone text,
  p_governorate text,
  p_city_area text,
  p_address_details text,
  p_items jsonb,
  p_subtotal numeric,
  p_shipping_cost numeric,
  p_total numeric,
  p_payment_method text
)
returns table(ok boolean, message text, order_id bigint, order_number text, new_balance numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  current_balance numeric;
  created_id bigint;
  final_number text := p_order_number;
begin
  if uid is null then
    return query select false, 'يجب تسجيل الدخول أولاً', null::bigint, null::text, 0::numeric;
    return;
  end if;

  if p_payment_method not in ('wallet','cash') then
    return query select false, 'طريقة الدفع غير مدعومة', null::bigint, null::text, 0::numeric;
    return;
  end if;

  if p_total < 0 then
    return query select false, 'قيمة الطلب غير صحيحة', null::bigint, null::text, 0::numeric;
    return;
  end if;

  if p_payment_method = 'wallet' then
    select balance into current_balance from wallets where user_id = uid for update;
    current_balance := coalesce(current_balance, 0);
    if current_balance < p_total then
      return query select false, 'رصيد المحفظة غير كافٍ', null::bigint, null::text, current_balance;
      return;
    end if;
  else
    current_balance := coalesce((select balance from wallets where user_id = uid), 0);
  end if;

  insert into orders(order_number,user_id,customer_name,customer_phone,governorate,city_area,address_details,items,subtotal,shipping_cost,total,status,payment_method)
  values(final_number,uid,p_customer_name,p_customer_phone,p_governorate,p_city_area,p_address_details,coalesce(p_items,'[]'::jsonb),p_subtotal,p_shipping_cost,p_total,'طلب جديد',p_payment_method)
  returning id into created_id;

  if p_payment_method = 'wallet' and p_total > 0 then
    update wallets set balance = balance - p_total, updated_at = now() where user_id = uid;
    insert into wallet_transactions(user_id,amount,type,status,reference)
    values(uid,-p_total,'purchase','completed',final_number);
    select balance into current_balance from wallets where user_id = uid;
  end if;

  return query select true, 'تم إنشاء الطلب بنجاح', created_id, final_number, coalesce(current_balance,0);
exception when unique_violation then
  return query select false, 'رقم الطلب مستخدم، جرّب مرة ثانية', null::bigint, null::text, coalesce(current_balance,0);
end;
$$;

grant execute on function create_order_with_wallet(text,text,text,text,text,text,jsonb,numeric,numeric,numeric,text) to authenticated;

-- The public wallet page now uses direct contact with administration instead of Sham Cash.
insert into site_settings(key,value) values
('wallet_topup', jsonb_build_object('mode','direct_contact','title','شحن مباشر للمحفظة','note','لشحن المحفظة، تواصل مع الإدارة عبر واتساب أو الدعم.'))
on conflict (key) do update set value = excluded.value, updated_at = now();
