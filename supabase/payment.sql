-- Bkkari Tech — إضافة طريقة الدفع للطلبات
alter table orders add column if not exists payment_method text default 'cash';
