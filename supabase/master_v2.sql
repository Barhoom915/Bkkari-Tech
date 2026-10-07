-- BKKARI TECH MASTER V2 optional schema extensions.
-- Run after existing schema/features SQL. Existing tables/data are preserved.
create table if not exists wallets (id bigint generated always as identity primary key, user_id uuid unique references auth.users(id) on delete cascade, balance numeric(12,2) not null default 0 check (balance >= 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists wallet_transactions (id bigint generated always as identity primary key, user_id uuid not null references auth.users(id) on delete cascade, amount numeric(12,2) not null, type text not null check(type in ('deposit','purchase','refund','adjustment')), status text not null default 'pending', reference text, created_at timestamptz not null default now());
create table if not exists wishlists (id bigint generated always as identity primary key, user_id uuid not null references auth.users(id) on delete cascade, laptop_id bigint not null references laptops(id) on delete cascade, created_at timestamptz not null default now(), unique(user_id,laptop_id));
alter table wallets enable row level security; alter table wallet_transactions enable row level security; alter table wishlists enable row level security;
create policy "users read own wallet" on wallets for select using(auth.uid()=user_id);
create policy "users read own wallet transactions" on wallet_transactions for select using(auth.uid()=user_id);
create policy "users read own wishlist" on wishlists for select using(auth.uid()=user_id);
create policy "users manage own wishlist" on wishlists for all using(auth.uid()=user_id) with check(auth.uid()=user_id);

-- Account/profile + wallet/order improvements
alter table orders add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_user_id_idx on orders(user_id);
create policy "users read own orders" on orders for select using(auth.uid() = user_id);

-- Avatar storage. Create a public bucket for profile pictures.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "users upload own avatar" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update own avatar" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own avatar" on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
