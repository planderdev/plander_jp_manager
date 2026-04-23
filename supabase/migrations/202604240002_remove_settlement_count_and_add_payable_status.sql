drop type if exists public.settlement_status_new;

create type public.settlement_status_new as enum ('pending', 'payable', 'done');

alter table public.posts
  alter column settlement_status drop default;

alter table public.posts
  alter column settlement_status type public.settlement_status_new
  using (
    case
      when settlement_status::text = 'pending'
        and coalesce(nullif(trim(post_url), ''), '') <> '' then 'payable'
      when settlement_status::text = 'done' then 'done'
      else 'pending'
    end
  )::public.settlement_status_new;

drop type public.settlement_status;

alter type public.settlement_status_new rename to settlement_status;

alter table public.posts
  alter column settlement_status set default 'pending'::public.settlement_status;

alter table public.posts
  drop constraint if exists posts_settlement_count_check;

alter table public.posts
  drop column if exists settlement_count;
