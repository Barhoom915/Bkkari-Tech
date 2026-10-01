-- ============================================================
-- Bkkari Tech | بكاري تيك — Database Schema
-- Run this once in Supabase → SQL Editor → New query → Run
-- ============================================================

-- ---------- المحافظات والشحن ----------
create table if not exists governorates (
  id bigint generated always as identity primary key,
  name text not null unique,
  shipping_cost numeric(10,2) not null default 0,
  delivery_days text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- اللابتوبات ----------
create table if not exists laptops (
  id bigint generated always as identity primary key,
  sku text unique,
  name text not null,
  brand text,
  model text,
  category text not null default 'Business',
  cpu text,
  ram text,
  storage text,
  gpu text,
  screen_size text,
  screen_resolution text,
  condition text,
  battery_health text,
  price numeric(10,2) not null,
  prev_price numeric(10,2),
  description text,
  features text[] default '{}',
  images text[] default '{}',
  stock_quantity int not null default 0,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  is_new boolean not null default false,
  gift_box boolean not null default false,
  gift_mouse boolean not null default false,
  gift_bag boolean not null default false,
  gift_software_pack boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- الألعاب والخدمات الرقمية ----------
create table if not exists digital_services (
  id bigint generated always as identity primary key,
  name text not null,
  image text,
  price numeric(10,2),
  details text,
  execution_method text,
  expected_duration text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- تصميم وبرمجة المواقع (كتالوج الخدمات) ----------
create table if not exists web_dev_services (
  id bigint generated always as identity primary key,
  name text not null,
  image text,
  description text,
  features text[] default '{}',
  starting_price numeric(10,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- طلبات برمجة المواقع (نموذج الطلب) ----------
create table if not exists web_dev_requests (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  website_type text,
  budget text,
  project_details text,
  current_website_url text,
  status text not null default 'جديد',
  created_at timestamptz not null default now()
);

-- ---------- العملاء ----------
create table if not exists customers (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  governorate text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- الطلبات ----------
create table if not exists orders (
  id bigint generated always as identity primary key,
  order_number text not null unique,
  customer_id bigint references customers(id),
  customer_name text not null,
  customer_phone text not null,
  governorate text not null,
  city_area text,
  address_details text,
  items jsonb not null default '[]',
  subtotal numeric(10,2) not null default 0,
  shipping_cost numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'طلب جديد',
  admin_notes text,
  created_at timestamptz not null default now()
);

-- ---------- إعدادات المحتوى (Hero، بانرات، معلومات التواصل...) ----------
create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table governorates enable row level security;
alter table laptops enable row level security;
alter table digital_services enable row level security;
alter table web_dev_services enable row level security;
alter table web_dev_requests enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table site_settings enable row level security;

-- القراءة العامة مسموحة فقط للمحتوى المعروض بالموقع (منتجات/خدمات/محافظات/إعدادات)
create policy "public read governorates" on governorates for select using (is_active = true);
create policy "public read laptops" on laptops for select using (true);
create policy "public read digital_services" on digital_services for select using (is_active = true);
create policy "public read web_dev_services" on web_dev_services for select using (is_active = true);
create policy "public read site_settings" on site_settings for select using (true);

-- الزوار يقدروا يرسلوا طلب/يسجلوا كعميل، بس ما يقدروا يقروا بيانات غيرهم
create policy "public can create orders" on orders for insert with check (true);
create policy "public can create customers" on customers for insert with check (true);
create policy "public can create web_dev_requests" on web_dev_requests for insert with check (true);

-- ملاحظة: عرض/تعديل الطلبات والعملاء بلوحة التحكم بيصير عبر مفتاح
-- service_role من السيرفر فقط (ما بيمر عبر RLS) — ما تحطه أبداً بكود الواجهة.
