-- BKKARI TECH V22: user management + wallet admin adjustments + Sham Cash address setting
-- No profile table is required: user ID/name/email/phone are read securely from Supabase Auth by the admin server.

-- Ensure wallet transactions can record admin adjustments.
alter table if exists wallet_transactions drop constraint if exists wallet_transactions_type_check;
alter table if exists wallet_transactions add constraint wallet_transactions_type_check check(type in ('deposit','purchase','refund','adjustment'));

-- Keep the Sham Cash payment setting ready for an address/number entered from Admin > Settings > Payment.
insert into site_settings(key,value) values(
  'wallet_payment',
  jsonb_build_object(
    'method','شام كاش',
    'account_name','BKKARI TECH',
    'account_number','',
    'image_url','',
    'note','حوّل المبلغ عبر شام كاش ثم أرسل رقم العملية وصورة الإيصال.'
  )
) on conflict(key) do update set value = site_settings.value || jsonb_build_object('method','شام كاش'), updated_at=now();
