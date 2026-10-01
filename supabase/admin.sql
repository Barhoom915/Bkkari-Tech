-- ============================================================
-- Bkkari Tech — صلاحيات لوحة التحكم (بس لإيميل المالك)
-- شغّل هاد الملف بعد features.sql
-- ============================================================

-- غيّر الإيميل هون إذا حبيت تستخدم إيميل تاني للإدارة لاحقاً
-- (كرره بكل سطر أدناه إذا غيرته)

-- ---------- الطلبات: قراءة وتحديث للإدمن بس ----------
create policy "admin read orders" on orders
  for select using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

create policy "admin update orders" on orders
  for update using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

-- ---------- العملاء: قراءة للإدمن بس ----------
create policy "admin read customers" on customers
  for select using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

-- ---------- طلبات برمجة المواقع: قراءة وتحديث للإدمن ----------
create policy "admin read web_dev_requests" on web_dev_requests
  for select using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

create policy "admin update web_dev_requests" on web_dev_requests
  for update using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

-- ---------- اللابتوبات: إضافة/تعديل/حذف للإدمن بس ----------
create policy "admin insert laptops" on laptops
  for insert with check (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

create policy "admin update laptops" on laptops
  for update using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

create policy "admin delete laptops" on laptops
  for delete using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

-- ---------- الخدمات الرقمية وخدمات البرمجة: إدارة كاملة للإدمن ----------
create policy "admin manage digital_services" on digital_services
  for all using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com')
  with check (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

create policy "admin manage web_dev_services" on web_dev_services
  for all using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com')
  with check (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

-- ---------- المحافظات: تعديل تكلفة الشحن للإدمن ----------
create policy "admin manage governorates" on governorates
  for all using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com')
  with check (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

-- ---------- الكوبونات: إدارة كاملة للإدمن ----------
create policy "admin manage coupons" on coupons
  for all using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com')
  with check (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

-- ---------- الآراء: قراءة الكل (حتى الغير موافق عليها) + الموافقة/الحذف للإدمن ----------
create policy "admin read all reviews" on reviews
  for select using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

create policy "admin update reviews" on reviews
  for update using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

create policy "admin delete reviews" on reviews
  for delete using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

-- ---------- إعدادات الموقع: تعديل للإدمن ----------
create policy "admin manage site_settings" on site_settings
  for all using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com')
  with check (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');
