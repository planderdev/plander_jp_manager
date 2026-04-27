import 'server-only';

import { formatInviteDate } from '@/lib/briefing';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWebPushNotification } from '@/lib/web-push';

export async function sendScheduleCreatedPush(scheduleId: number) {
  const admin = createAdminClient();
  const { data: schedule } = await admin
    .from('schedules')
    .select('id, scheduled_at, clients(company_name), influencers(handle)')
    .eq('id', scheduleId)
    .maybeSingle();

  if (!schedule) {
    return { ok: false, reason: 'missing_schedule' } as const;
  }

  const clientName = (schedule as any).clients?.company_name ?? '업체';
  const influencerHandle = (schedule as any).influencers?.handle ?? 'influencer';
  const scheduledAt = schedule.scheduled_at ? formatInviteDate(schedule.scheduled_at) : null;

  const result = await sendWebPushNotification((locale) => ({
    title: locale === 'ja' ? '新規スケジュール登録' : '새 스케줄 등록',
    body:
      locale === 'ja'
        ? [clientName, `@${influencerHandle}`, scheduledAt].filter(Boolean).join(' / ') || '新しいスケジュールが登録されました。'
        : [clientName, `@${influencerHandle}`, scheduledAt].filter(Boolean).join(' / ') || '새 스케줄이 등록되었습니다.',
    url: '/campaigns/schedules',
    tag: `schedule-${scheduleId}`,
  }));

  return { ok: true, ...result } as const;
}
