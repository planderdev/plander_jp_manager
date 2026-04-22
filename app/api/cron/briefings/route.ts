import { NextResponse } from 'next/server';
import { runScheduledBriefingEmails, sendBriefingEmail } from '@/lib/briefing-email';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = Number(searchParams.get('scheduleId') || '0');

    if (scheduleId > 0) {
      const result = await sendBriefingEmail(scheduleId, 'manual');
      return NextResponse.json({ ok: true, mode: 'manual', scheduleId, result });
    }

    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const result = await runScheduledBriefingEmails();
    return NextResponse.json({ ok: true, mode: 'scheduled', ...result });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'unknown_error' },
      { status: 500 }
    );
  }
}
