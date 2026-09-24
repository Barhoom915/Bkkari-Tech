-- Bkkari Tech V18 — notifications + web push
create extension if not exists pgcrypto;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  href text,
  kind text not null default 'general',
  target_user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists notification_reads (
  notification_id uuid not null references notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_read boolean not null default false,
  read_at timestamptz,
  primary key(notification_id,user_id)
);

create table if not exists push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  updated_at timestamptz not null default now()
);

alter table notifications enable row level security;
alter table notification_reads enable row level security;
alter table push_subscriptions enable row level security;

create policy "users read their notifications" on notifications for select using (target_user_id is null or target_user_id = auth.uid());
create policy "users manage own notification reads" on notification_reads for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users manage own push subscriptions" on push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists notifications_created_idx on notifications(created_at desc);
create index if not exists notifications_target_idx on notifications(target_user_id, created_at desc);
create index if not exists notification_reads_user_idx on notification_reads(user_id, is_read);
create index if not exists push_subscriptions_user_idx on push_subscriptions(user_id);

create or replace function notify_order_status_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' then
    insert into notifications(title,body,href,kind,target_user_id)
    values ('📦 تم استلام طلبك', 'طلبك ' || coalesce(new.order_number,'') || ' وصلنا وعم نراجعه.', '/track', 'order', new.user_id);
  elsif old.status is distinct from new.status then
    insert into notifications(title,body,href,kind,target_user_id)
    values ('تحديث طلبك 📦', 'حالة الطلب ' || coalesce(new.order_number,'') || ': ' || coalesce(new.status,'محدّث') || '.', '/track', 'order', new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists orders_notification_trigger on orders;
create trigger orders_notification_trigger
after insert or update of status on orders
for each row execute function notify_order_status_change();
