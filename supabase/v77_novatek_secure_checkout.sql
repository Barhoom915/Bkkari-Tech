-- NOVATEK V77 — secure authenticated checkout and wallet idempotency
-- Apply only if these database changes are required by the application version.

alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.orders add column if not exists payment_method text default 'cash';
alter table public.orders add column if not exists terms_accepted_at timestamptz;

create unique index if not exists wallet_purchase_reference_unique
on public.wallet_transactions(user_id, reference)
where type = 'purchase';

create or replace function public.create_order_with_wallet(
  p_order_number text, p_customer_name text, p_customer_phone text, p_governorate text,
  p_city_area text, p_address_details text, p_items jsonb, p_subtotal numeric,
  p_shipping_cost numeric, p_total numeric, p_payment_method text, p_coupon_code text default ''
)
returns table(ok boolean, message text, order_id bigint, order_number text, new_balance numeric)
language plpgsql security definer set search_path=public
as $$
declare
  uid uuid := auth.uid(); item jsonb; item_id text; item_qty integer; base_id bigint;
  unit_price numeric; calc_subtotal numeric := 0; calc_total numeric := 0; ship numeric := greatest(coalesce(p_shipping_cost,0),0);
  discount numeric := 0; coupon record; current_balance numeric := 0; created_id bigint; normalized_items jsonb := '[]'::jsonb; existing_id bigint;
begin
  if uid is null then return query select false,'يجب تسجيل الدخول أولاً',null::bigint,null::text,0::numeric; return; end if;
  if p_payment_method not in ('wallet','cash') then return query select false,'طريقة الدفع غير مدعومة',null::bigint,null::text,0::numeric; return; end if;
  select id into existing_id from orders where order_number=p_order_number and user_id=uid limit 1;
  if existing_id is not null then
    select balance into current_balance from wallets where user_id=uid;
    return query select true,'الطلب موجود مسبقاً',existing_id,p_order_number,coalesce(current_balance,0); return;
  end if;

  for item in select * from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) loop
    item_id := coalesce(item->>'id',''); item_qty := greatest(1,least(50,coalesce((item->>'qty')::integer,1))); unit_price := null;
    if item_id like 'laptop-%' then
      base_id := nullif(split_part(item_id,'-',2),'')::bigint;
      if base_id is null then raise exception 'منتج لابتوب غير صالح'; end if;
      select price into unit_price from laptops where id=base_id and is_available=true and stock_quantity>=item_qty;
    elsif item_id like 'ps-%' then
      base_id := nullif(split_part(item_id,'-',2),'')::bigint;
      if base_id is null then raise exception 'منتج PlayStation غير صالح'; end if;
      select price into unit_price from playstation_products where id=base_id and is_available=true and stock_quantity>=item_qty;
    else raise exception 'معرّف منتج غير صالح'; end if;
    if unit_price is null then raise exception 'أحد المنتجات غير متوفر أو نفد مخزونه'; end if;
    calc_subtotal := calc_subtotal + unit_price*item_qty;
    normalized_items := normalized_items || jsonb_build_array(item || jsonb_build_object('price',unit_price,'qty',item_qty));
  end loop;

  if nullif(trim(coalesce(p_coupon_code,'')),'') is not null then
    select * into coupon from validate_coupon(trim(p_coupon_code),calc_subtotal);
    if coalesce(coupon.valid,false) then
      discount := case when coupon.discount_type='percentage' then calc_subtotal*coupon.discount_value/100 else coupon.discount_value end;
      discount := least(greatest(discount,0),calc_subtotal);
    end if;
  end if;
  calc_total := greatest(0,round(calc_subtotal+ship-discount,2));

  if p_payment_method='wallet' then
    select balance into current_balance from wallets where user_id=uid for update;
    current_balance:=coalesce(current_balance,0);
    if current_balance<calc_total then return query select false,'رصيد المحفظة غير كافٍ',null::bigint,null::text,current_balance; return; end if;
  else current_balance:=coalesce((select balance from wallets where user_id=uid),0); end if;

  insert into orders(order_number,user_id,customer_name,customer_phone,governorate,city_area,address_details,items,subtotal,shipping_cost,total,status,payment_method,terms_accepted_at)
  values(p_order_number,uid,trim(p_customer_name),trim(p_customer_phone),trim(p_governorate),nullif(trim(p_city_area),''),trim(p_address_details),normalized_items,round(calc_subtotal,2),ship,calc_total,'طلب جديد',p_payment_method,now()) returning id into created_id;

  for item in select * from jsonb_array_elements(normalized_items) loop
    item_id:=item->>'id'; item_qty:=greatest(1,(item->>'qty')::integer);
    if item_id like 'laptop-%' then
      base_id:=nullif(split_part(item_id,'-',2),'')::bigint;
      update laptops set stock_quantity=stock_quantity-item_qty,is_available=(stock_quantity-item_qty)>0,updated_at=now() where id=base_id;
    elsif item_id like 'ps-%' then
      base_id:=nullif(split_part(item_id,'-',2),'')::bigint;
      update playstation_products set stock_quantity=stock_quantity-item_qty,is_available=(stock_quantity-item_qty)>0 where id=base_id;
    end if;
  end loop;

  if p_payment_method='wallet' and calc_total>0 then
    update wallets set balance=balance-calc_total,updated_at=now() where user_id=uid;
    insert into wallet_transactions(user_id,amount,type,status,reference) values(uid,-calc_total,'purchase','completed',p_order_number);
    select balance into current_balance from wallets where user_id=uid;
  end if;
  return query select true,'تم إنشاء الطلب بنجاح',created_id,p_order_number,current_balance;
exception when unique_violation then
  select id into existing_id from orders where order_number=p_order_number and user_id=uid limit 1;
  return query select true,'الطلب موجود مسبقاً',existing_id,p_order_number,coalesce((select balance from wallets where user_id=uid),0);
when others then
  return query select false,coalesce(sqlerrm,'تعذر إنشاء الطلب'),null::bigint,null::text,coalesce((select balance from wallets where user_id=uid),0);
end; $$;

grant execute on function public.create_order_with_wallet(text,text,text,text,text,text,jsonb,numeric,numeric,numeric,text,text) to authenticated;


drop policy if exists "public can create orders" on public.orders;

-- Digital orders: client idempotency + safe wallet reservation/refund helpers.
alter table public.digital_service_orders add column if not exists client_request_id uuid;
create unique index if not exists digital_service_orders_client_request_unique on public.digital_service_orders(client_request_id) where client_request_id is not null;

create or replace function public.refund_wallet_for_service(p_user_id uuid,p_amount numeric,p_reference text)
returns table(ok boolean,message text,new_balance numeric)
language plpgsql security definer set search_path=public as $$
declare b numeric; already_refunded boolean;
begin
  if p_user_id is null or p_amount < 0 then return query select false,'قيمة الاسترجاع غير صحيحة',0::numeric; return; end if;
  select exists(select 1 from wallet_transactions where user_id=p_user_id and reference=p_reference||':refund' and type='refund') into already_refunded;
  if already_refunded then select balance into b from wallets where user_id=p_user_id; return query select true,'تم الاسترجاع مسبقاً',coalesce(b,0); return; end if;
  update wallets set balance=balance+p_amount,updated_at=now() where user_id=p_user_id returning balance into b;
  if b is null then return query select false,'المحفظة غير موجودة',0::numeric; return; end if;
  insert into wallet_transactions(user_id,amount,type,status,reference) values(p_user_id,p_amount,'refund','completed',p_reference||':refund');
  return query select true,'تم استرجاع الرصيد',b;
end; $$;
revoke all on function public.refund_wallet_for_service(uuid,numeric,text) from public;
grant execute on function public.refund_wallet_for_service(uuid,numeric,text) to service_role;
