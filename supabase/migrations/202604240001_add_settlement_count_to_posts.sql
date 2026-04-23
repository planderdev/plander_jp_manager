alter table public.posts
  add column if not exists settlement_count integer not null default 1;

update public.posts
set settlement_count = 1
where settlement_count is null or settlement_count < 1;

alter table public.posts
  drop constraint if exists posts_settlement_count_check;

alter table public.posts
  add constraint posts_settlement_count_check
  check (settlement_count >= 1);
