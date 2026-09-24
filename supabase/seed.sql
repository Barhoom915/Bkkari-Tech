-- شغّل هاد الملف بعد schema.sql — بيعمر المحافظات وشوي منتجات تجريبية
-- تقدر تشغله بأمان أكثر من مرة بسبب ON CONFLICT
-- عدّل الأسعار والمنتجات لاحقاً من لوحة التحكم

insert into governorates (name, shipping_cost, delivery_days) values
  ('دمشق', 3, '1-2 يوم'),
  ('ريف دمشق', 4, '1-2 يوم'),
  ('حمص', 5, '2-3 أيام'),
  ('حماة', 5, '2-3 أيام'),
  ('طرطوس', 6, '2-3 أيام'),
  ('اللاذقية', 6, '2-3 أيام'),
  ('حلب', 7, '3-4 أيام'),
  ('إدلب', 7, '3-4 أيام'),
  ('درعا', 5, '2-3 أيام'),
  ('السويداء', 5, '2-3 أيام'),
  ('القنيطرة', 5, '2-3 أيام'),
  ('دير الزور', 8, '4-5 أيام'),
  ('الرقة', 8, '4-5 أيام'),
  ('الحسكة', 8, '4-5 أيام')
on conflict (name) do nothing;

insert into laptops
  (sku, name, brand, model, category, cpu, ram, storage, gpu, screen_size, screen_resolution, condition, battery_health, price, prev_price, description, features, stock_quantity, is_featured, is_bestseller, gift_box, gift_mouse)
values
  ('BK-LT-0001', 'Lenovo ThinkPad T14', 'Lenovo', 'T14 Gen 2', 'Business', 'Intel i5', '16GB', '512GB SSD', 'Intel Iris Xe', '14 inch', '1920x1080', 'مستعمل — حالة ممتازة', '92%', 420, 480,
    'لابتوب أعمال قوي ومتين، مناسب للاستخدام المكتبي والبرمجة الخفيفة.',
    array['كيبورد مقاوم للماء', 'بصمة أمان', 'بطارية تدوم طول اليوم'], 5, true, false, true, true),
  ('BK-LT-0002', 'Dell G15 Gaming', 'Dell', 'G15 5520', 'Gaming', 'Intel i7', '16GB', '512GB SSD', 'RTX 3050', '15.6 inch', '1920x1080 144Hz', 'جديد', '100%', 780, 850,
    'لابتوب قيمنغ بأداء عالي لتشغيل الألعاب الحديثة بسلاسة.',
    array['شاشة 144Hz', 'تبريد متقدم', 'إضاءة RGB للكيبورد'], 3, true, true, true, true),
  ('BK-LT-0003', 'HP EliteBook 840', 'HP', '840 G5', 'Business', 'Intel i5', '8GB', '256GB SSD', 'Intel UHD', '14 inch', '1920x1080', 'مستعمل — حالة جيدة جداً', '87%', 260, null,
    'خيار اقتصادي موثوق للاستخدام اليومي والمكتبي.',
    array['خفيف الوزن', 'مناسب للطلاب'], 8, false, false, false, false)
on conflict (sku) do nothing;

insert into site_settings (key, value) values
  ('contact', '{
    "phone": "0936426605",
    "whatsapp": "963936426605",
    "telegram": "@NexCode9",
    "facebook": "https://www.facebook.com/share/1BZU7LUd2o/",
    "email": "ibrahimbkkari51@gmail.com"
  }'::jsonb)
on conflict (key) do update set value = excluded.value;
