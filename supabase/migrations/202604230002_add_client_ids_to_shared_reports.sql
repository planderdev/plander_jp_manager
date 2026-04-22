alter table public.shared_reports
  add column if not exists client_ids bigint[];

update public.shared_reports
set client_ids = array[client_id]
where client_ids is null;

drop index if exists shared_reports_client_month_key;

create index if not exists shared_reports_client_month_idx
  on public.shared_reports (client_id, year_month);

create index if not exists shared_reports_client_ids_idx
  on public.shared_reports using gin (client_ids);
