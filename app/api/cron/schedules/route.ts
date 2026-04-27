import { NextResponse } from 'next/server';

import { getAutomationCronSecret } from '@/lib/briefing-config';
import { runScheduledScheduleReminders } from '@/lib/schedule-reminders';

export const runtime = 'nodejs';

function isAuthorized(request: Request, expectedSecret: string | null) {
  if (!expectedSecret) return false;

  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader === `Bearer ${expectedSecret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get('token') === expectedSecret;
}

export async function GET(request: Request) {
  const secret = await getAutomationCronSecret();

  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runScheduledScheduleReminders(new Date());
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'schedule_reminders_failed' },
      { status: 500 }
    );
  }
}
