alter table public.influencers
  add column if not exists age integer,
  add column if not exists gender text;

alter table public.influencers
  drop constraint if exists influencers_age_check;

alter table public.influencers
  drop constraint if exists influencers_gender_check;

alter table public.influencers
  add constraint influencers_age_check
    check (age is null or age between 0 and 120);

alter table public.influencers
  add constraint influencers_gender_check
    check (gender is null or gender in ('female', 'male', 'other'));
