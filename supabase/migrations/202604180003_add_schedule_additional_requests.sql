alter table public.schedules
  add column if not exists additional_requests text;
