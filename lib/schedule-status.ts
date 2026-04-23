import type { Locale } from '@/lib/i18n/config';
import { translate } from '@/lib/i18n/config';

export type ScheduleStatus = 'reserved' | 'upload_pending' | 'settlement_pending' | 'done';

type SchedulePost = { post_url?: string | null; settlement_status?: string | null };

export function getScheduleStatus(
  scheduledAt: string,
  posts: SchedulePost[] | SchedulePost | null | undefined
): ScheduleStatus {
  const isPast = new Date(scheduledAt) < new Date();
  if (!isPast) return 'reserved';

  const postList = Array.isArray(posts) ? posts : posts ? [posts] : [];
  const hasPost = postList.length > 0;

  if (!hasPost || postList.some(p => p.settlement_status === 'pending')) return 'upload_pending';

  if (postList.some(p => p.settlement_status === 'payable')) return 'settlement_pending';

  return 'done';
}

export function statusLabel(s: ScheduleStatus, locale: Locale = 'ko'): string {
  switch (s) {
    case 'reserved': return translate(locale, 'schedule.reserved');
    case 'upload_pending': return translate(locale, 'schedule.upload_pending');
    case 'settlement_pending': return translate(locale, 'schedule.settlement_pending');
    case 'done': return translate(locale, 'schedule.done');
  }
}

export function statusColor(s: ScheduleStatus): string {
  switch (s) {
    case 'reserved': return 'text-orange-500';
    case 'upload_pending': return 'text-red-500';
    case 'settlement_pending': return 'text-red-500';
    case 'done': return 'text-green-600';
  }
}
