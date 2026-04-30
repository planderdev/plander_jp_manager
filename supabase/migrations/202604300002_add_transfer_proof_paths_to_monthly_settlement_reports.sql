alter table public.monthly_settlement_reports
  add column if not exists transfer_proof_paths text[] not null default '{}';
