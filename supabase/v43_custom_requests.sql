-- BKKARI TECH V43 — PC build + PlayStation preorder requests
create table if not exists public.custom_requests (
  id bigint generated always as identity primary key,
  request_number text unique,
  request_type text not null check (request_type in ('pc_build','playstation')),
  category text,
  variant text,
  cpu text,
  gpu text,
  ram text,
  storage text,
  monitor text,
  accessories text,
  budget numeric(12,2),
  ps_storage text,
  ps_condition text,
  customer_name text not null,
  customer_phone text not null,
  governorate text,
  city_area text,
  notes text,
  status text not null default 'جديد' check (status in ('جديد','قيد التواصل','تم التسعير','تم التأكيد','تم التنفيذ','ملغي')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_requests_created_idx on public.custom_requests(created_at desc);
create index if not exists custom_requests_status_idx on public.custom_requests(status);
create index if not exists custom_requests_type_idx on public.custom_requests(request_type);

alter table public.custom_requests enable row level security;

drop policy if exists "public submit custom requests" on public.custom_requests;
create policy "public submit custom requests"
on public.custom_requests for insert
to anon, authenticated
with check (
  request_type in ('pc_build','playstation')
  and length(trim(customer_name)) between 2 and 120
  and length(trim(customer_phone)) between 6 and 40
);

drop policy if exists "admin manage custom requests" on public.custom_requests;
create policy "admin manage custom requests"
on public.custom_requests for all
to authenticated
using (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com')
with check (auth.jwt() ->> 'email' = 'ibrahimbkkari51@gmail.com');

create or replace function public.set_custom_request_number()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.request_number is null then
    new.request_number := 'REQ-' || lpad(new.id::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists custom_request_number_trigger on public.custom_requests;
create trigger custom_request_number_trigger
before insert on public.custom_requests
for each row execute function public.set_custom_request_number();

update public.custom_requests
set request_number = 'REQ-' || lpad(id::text, 4, '0')
where request_number is null;
