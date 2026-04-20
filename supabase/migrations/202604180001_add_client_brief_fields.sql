alter table public.clients
  add column if not exists store_name_ja text,
  add column if not exists address_ja text,
  add column if not exists business_hours text,
  add column if not exists provided_menu text;

alter table public.schedules
  add column if not exists provided_menu text;
