-- ============================================================
-- Bkkari Tech — صور مجموعات الخدمات الرقمية + إعدادات جديدة
-- شغّل هاد الملف مرة وحدة على قاعدة البيانات (نفسها لكلا الموقعين)
-- ============================================================

-- صورة واحدة تتطبق على كل منتجات "مجموعة" معينة (مثلاً كل منتجات ببجي)
-- بدل نظام الكلمات المفتاحية القديم (CATEGORY ARTWORK) يلي كان عرضة للأخطاء
create table if not exists digital_group_overrides (
  group_key text primary key,
  custom_image text,
  updated_at timestamptz not null default now()
);

alter table digital_group_overrides enable row level security;

create policy "public read digital_group_overrides" on digital_group_overrides
  for select using (true);

create policy "admin manage digital_group_overrides" on digital_group_overrides
  for all using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com')
  with check (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

-- نسبة ربح تطبيقات الدردشة ونظام ترتيب الأقسام محفوظين أصلاً بجدول site_settings
-- الموجود، فما بيحتاجوا جدول جديد -- بس نتأكد إنه موجود الإعداد الافتراضي
insert into site_settings (key, value)
values ('chat_markup_percent', '5'::jsonb)
on conflict (key) do nothing;
