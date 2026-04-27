import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { getDeliverySettings, getSchedulePushLogEntry, markSchedulePushSent } from '@/lib/briefing-config';
import { formatInviteDate } from '@/lib/briefing';
import { sendWebPushNotification } from '@/lib/web-push';

const AUTOMATION_WINDOW_MS = 5 * 60 * 1000;

function getScheduledWindow(now: Date, minutesBefore: number) {
  const leadMs = minutesBefore * 60 * 1000;
  return {
    windowStartIso: new Date(now.getTime() + leadMs - AUTOMATION_WINDOW_MS).toISOString(),
    windowEndIso: new Date(now.getTime() + leadMs).toISOString(),
  };
}

export async function runScheduledScheduleReminders(now = new Date()) {
  const sb = createAdminClient();
  const deliverySettings = await getDeliverySettings();
  const schedulePushMinutesBefore = deliverySettings.schedulePushMinutesBefore;
  const { windowStartIso, windowEndIso } = getScheduledWindow(now, schedulePushMinutesBefore);

  const { data: schedules, error } = await sb
    .from('schedules')
    .select('id, scheduled_at, clients(company_name), influencers(handle)')
    .gt('scheduled_at', windowStartIso)
    .lte('scheduled_at', windowEndIso)
    .order('scheduled_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const dueSchedules: Array<{
    id: number;
    label: string;
  }> = [];
  const results: Array<{ scheduleId: number; status: string; reason?: string }> = [];

  for (const schedule of schedules ?? []) {
    const targetKey = `${schedule.scheduled_at}|${schedulePushMinutesBefore}`;
    const logEntry = await getSchedulePushLogEntry(schedule.id);

    if (logEntry?.targetKey === targetKey) {
      results.push({ scheduleId: schedule.id, status: 'skipped', reason: 'already_sent' });
      continue;
    }

    const clientName = (schedule as any).clients?.company_name ?? '업체';
    const influencerHandle = (schedule as any).influencers?.handle ?? 'influencer';
    const scheduledAtLabel = schedule.scheduled_at ? formatInviteDate(schedule.scheduled_at) : null;

    dueSchedules.push({
      id: schedule.id,
      label: [clientName, `@${influencerHandle}`, scheduledAtLabel].filter(Boolean).join(' / '),
    });
  }

  if (dueSchedules.length > 0) {
    const first = dueSchedules[0];

    await sendWebPushNotification((locale) => ({
      title: locale === 'ja' ? 'まもなく開始のスケジュール' : '다가오는 스케줄 알림',
      body:
        dueSchedules.length === 1
          ? (
            locale === 'ja'
              ? `${first.label} の予定がまもなく始まります。`
              : `${first.label} 일정이 곧 시작됩니다.`
          )
          : (
            locale === 'ja'
              ? `まもなく ${dueSchedules.length} 件のスケジュールがあります。`
              : `곧 ${dueSchedules.length}건의 스케줄이 있습니다.`
          ),
      url: '/campaigns/schedules',
      tag: `schedule-reminder-${schedulePushMinutesBefore}`,
    }));

    const sentAt = new Date().toISOString();
    for (const schedule of dueSchedules) {
      const scheduleRow = (schedules ?? []).find((row) => row.id === schedule.id);
      if (!scheduleRow?.scheduled_at) continue;
      await markSchedulePushSent(schedule.id, {
        targetKey: `${scheduleRow.scheduled_at}|${schedulePushMinutesBefore}`,
        sentAt,
      });
      results.push({ scheduleId: schedule.id, status: 'sent' });
    }
  }

  return {
    schedulePushMinutesBefore,
    total: schedules?.length ?? 0,
    sent: dueSchedules.length,
    results,
  };
}
