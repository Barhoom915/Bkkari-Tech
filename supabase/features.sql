-- ============================================================
-- Bkkari Tech — إضافات: تتبع الطلب، الآراء، الكوبونات، العدادات
-- شغّل هاد الملف بعد schema.sql و seed.sql
-- ============================================================

-- ---------- آراء الزبائن ----------
create table if not exists reviews (
  id bigint generated always as identity primary key,
  laptop_id bigint not null references laptops(id) on delete cascade,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;

create policy "public read approved reviews" on reviews
  for select using (is_approved = true);

create policy "public can submit reviews" on reviews
  for insert with check (true);

-- ---------- عداد المشاهدات (لعرض "X شخص شاف المنتج اليوم") ----------
create table if not exists product_views (
  id bigint generated always as identity primary key,
  laptop_id bigint not null references laptops(id) on delete cascade,
  viewed_on date not null default current_date,
  view_count int not null default 1,
  unique (laptop_id, viewed_on)
);

alter table product_views enable row level security;

create policy "public read product_views" on product_views
  for select using (true);

-- دالة آمنة لزيادة عداد المشاهدة (بدل ما نعطي صلاحية update مباشرة للعامة)
create or replace function increment_product_view(p_laptop_id bigint)
returns void
language plpgsql
security definer
as $$
begin
  insert into product_views (laptop_id, viewed_on, view_count)
  values (p_laptop_id, current_date, 1)
  on conflict (laptop_id, viewed_on)
  do update set view_count = product_views.view_count + 1;
end;
$$;

-- ---------- كوبونات الخصم ----------
create table if not exists coupons (
  id bigint generated always as identity primary key,
  code text not null unique,
  discount_type text not null default 'percentage', -- percentage | fixed
  discount_value numeric(10,2) not null,
  min_order_total numeric(10,2) default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int,
  used_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table coupons enable row level security;

-- ما منسمح بقراءة كل الكوبونات مباشرة (حتى ما حدا يشوفها كلها)
-- بدل هيك، دالة تتحقق من كود وحدة وترجع النتيجة بس
create or replace function validate_coupon(p_code text, p_order_total numeric)
returns table (
  valid boolean,
  message text,
  discount_type text,
  discount_value numeric
)
language plpgsql
security definer
as $$
declare
  c coupons%rowtype;
begin
  select * into c from coupons where code = upper(p_code) and is_active = true;

  if not found then
    return query select false, 'كود الخصم غير صحيح', null::text, null::numeric;
    return;
  end if;

  if c.starts_at is not null and now() < c.starts_at then
    return query select false, 'الكوبون لسا ما فعّل', null::text, null::numeric;
    return;
  end if;

  if c.ends_at is not null and now() > c.ends_at then
    return query select false, 'انتهت صلاحية الكوبون', null::text, null::numeric;
    return;
  end if;

  if c.usage_limit is not null and c.used_count >= c.usage_limit then
    return query select false, 'وصل الكوبون للحد الأقصى من الاستخدام', null::text, null::numeric;
    return;
  end if;

  if p_order_total < coalesce(c.min_order_total, 0) then
    return query select false, format('الحد الأدنى للطلب %s$', c.min_order_total), null::text, null::numeric;
    return;
  end if;

  return query select true, 'تم تطبيق الخصم بنجاح', c.discount_type, c.discount_value;
end;
$$;

-- ---------- تتبع الطلب العام (بدون تسجيل دخول) ----------
-- دالة آمنة: بترجع معلومات محدودة عن الطلب بس إذا طابق رقم الطلب + رقم الهاتف
create or replace function track_order(p_order_number text, p_phone text)
returns table (
  order_number text,
  status text,
  total numeric,
  created_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
    select o.order_number, o.status, o.total, o.created_at
    from orders o
    where o.order_number = p_order_number
      and o.customer_phone = p_phone;
end;
$$;

-- ---------- شارة الضمان لكل منتج ----------
alter table laptops add column if not exists warranty_days int default 0;
