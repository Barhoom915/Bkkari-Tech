-- BKKARI TECH Catalog V3
-- Run after master_v2.sql/features.sql and the admin_controls.sql migration.

alter table if exists digital_service_overrides add column if not exists custom_description text;
alter table if exists digital_service_overrides add column if not exists custom_image text;

alter table if exists digital_service_overrides enable row level security;

drop policy if exists "public read active digital overrides" on digital_service_overrides;
create policy "public read active digital overrides" on digital_service_overrides
  for select using (is_active = true);

-- New reviews are visible immediately. Existing unapproved reviews remain unchanged until an admin updates them.
alter table if exists reviews alter column is_approved set default true;
