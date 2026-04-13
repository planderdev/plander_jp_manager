export type ScheduleStatus = 'reserved' | 'upload_pending' | 'settlement_pending' | 'done';

export function getScheduleStatus(
  scheduledAt: string,
  posts: { post_url?: string | null; settlement_status?: string | null }[] | null | undefined
): ScheduleStatus {
  const isPast = new Date(scheduledAt) < new Date();
  if (!isPast) return 'reserved';

  const hasUrl = posts?.some(p => p.post_url && p.post_url.trim() !== '') ?? false;
  if (!hasUrl) return 'upload_pending';

  const hasSettled = posts?.some(p => p.settlement_status === 'done') ?? false;
  if (!hasSettled) return 'settlement_pending';

  return 'done';
}

export function statusLabel(s: ScheduleStatus): string {
  switch (s) {
    case 'reserved': return '방문예정';
    case 'upload_pending': return '업로드 대기';
    case 'settlement_pending': return '정산 대기';
    case 'done': return '완료';
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