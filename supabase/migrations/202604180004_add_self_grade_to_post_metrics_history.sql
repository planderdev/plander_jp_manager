alter table public.post_metrics_history
  add column if not exists self_grade text;

alter table public.post_metrics_history
  drop constraint if exists post_metrics_history_self_grade_check;

alter table public.post_metrics_history
  add constraint post_metrics_history_self_grade_check
    check (self_grade is null or self_grade in ('S', 'A', 'B', 'C', 'F', 'pending'));
