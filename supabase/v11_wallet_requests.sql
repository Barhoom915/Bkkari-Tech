-- BKKARI TECH V11: web requests + wallet top-ups + reliable avatar uploads
alter table if exists web_dev_requests add column if not exists email text;

create table if not exists wallet_topup_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  transaction_number text not null,
  receipt_url text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists wallet_topup_requests_user_idx on wallet_topup_requests(user_id, created_at desc);
alter table wallet_topup_requests enable row level security;
drop policy if exists "users create own wallet topups" on wallet_topup_requests;
create policy "users create own wallet topups" on wallet_topup_requests for insert to authenticated with check(auth.uid() = user_id);
drop policy if exists "users read own wallet topups" on wallet_topup_requests;
create policy "users read own wallet topups" on wallet_topup_requests for select to authenticated using(auth.uid() = user_id);

insert into storage.buckets (id,name,public) values ('wallet-receipts','wallet-receipts',true)
on conflict (id) do update set public=true;
drop policy if exists "users upload own wallet receipt" on storage.objects;
create policy "users upload own wallet receipt" on storage.objects for insert to authenticated
with check(bucket_id='wallet-receipts' and (storage.foldername(name))[1]=auth.uid()::text);

-- Make profile image uploads robust even when the SQL was run before the bucket existed.
insert into storage.buckets (id,name,public) values ('avatars','avatars',true)
on conflict (id) do update set public=true;
drop policy if exists "users upload own avatar" on storage.objects;
create policy "users upload own avatar" on storage.objects for insert to authenticated
with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "users update own avatar" on storage.objects;
create policy "users update own avatar" on storage.objects for update to authenticated
using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text)
with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

-- Public payment instructions. The image URL can be filled later from the admin settings screen.
insert into site_settings(key,value) values
('wallet_payment', jsonb_build_object('method','شام كاش','account_name','BKKARI TECH','account_number','', 'image_url','', 'note','حوّل المبلغ ثم ارفع صورة الإيصال وأدخل رقم العملية.'))
on conflict (key) do nothing;

-- Admin-managed ShamCash payment image.
insert into storage.buckets (id,name,public) values ('payment-assets','payment-assets',true)
on conflict (id) do update set public=true;
drop policy if exists "admin upload payment assets" on storage.objects;
create policy "admin upload payment assets" on storage.objects for insert to authenticated
with check(bucket_id='payment-assets' and auth.jwt()->>'email'='ibrahimbkkari51@gmail.com');
drop policy if exists "admin update payment assets" on storage.objects;
create policy "admin update payment assets" on storage.objects for update to authenticated
using(bucket_id='payment-assets' and auth.jwt()->>'email'='ibrahimbkkari51@gmail.com')
with check(bucket_id='payment-assets' and auth.jwt()->>'email'='ibrahimbkkari51@gmail.com');
