-- NOVATEK V98.24 — wallet payment methods
-- Adds payment-method metadata to top-up requests without changing existing rows.
alter table if exists public.wallet_topup_requests add column if not exists payment_method text;
alter table if exists public.wallet_topup_requests add column if not exists payment_currency text;
alter table if exists public.wallet_topup_requests add column if not exists sent_amount numeric(14,2);
alter table if exists public.wallet_topup_requests add column if not exists exchange_rate numeric(14,4);
alter table if exists public.wallet_topup_requests add column if not exists destination_amount numeric(14,2);
alter table if exists public.wallet_topup_requests add column if not exists destination_account text;

create index if not exists wallet_topup_requests_payment_method_idx on public.wallet_topup_requests(payment_method, created_at desc);

-- Optional Sham Cash split accounts. Existing account_number remains the fallback.
insert into public.site_settings(key,value)
values (
  'wallet_payment',
  jsonb_build_object(
    'method','شام كاش',
    'account_name','NOVATEK',
    'account_number','',
    'syp_account_number','',
    'usd_account_number','',
    'image_url','',
    'note','حوّل المبلغ ثم أرسل رقم العملية وصورة إشعار التحويل.'
  )
)
on conflict (key) do update set
  value = coalesce(public.site_settings.value,'{}'::jsonb)
    || jsonb_build_object('syp_account_number', coalesce(public.site_settings.value->>'syp_account_number',''))
    || jsonb_build_object('usd_account_number', coalesce(public.site_settings.value->>'usd_account_number','')),
  updated_at = now();

notify pgrst, 'reload schema';
