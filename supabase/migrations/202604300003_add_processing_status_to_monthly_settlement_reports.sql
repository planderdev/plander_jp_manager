alter table public.monthly_settlement_reports
  add column if not exists processing_status text not null default 'done',
  add column if not exists processing_error text;

update public.monthly_settlement_reports
set processing_status = 'done'
where processing_status is null or processing_status = '';
