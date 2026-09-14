-- Bkkari Tech V20: account history + admin notification helpers
alter table if exists orders add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_user_id_idx on orders(user_id);
drop policy if exists "users read own orders" on orders;
create policy "users read own orders" on orders for select to authenticated using(auth.uid() = user_id);

-- Keep payment methods limited to wallet or cash.
alter table if exists orders drop constraint if exists orders_payment_method_check;
alter table if exists orders add constraint orders_payment_method_check check (payment_method is null or payment_method in ('wallet','cash'));
