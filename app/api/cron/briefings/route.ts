import { NextResponse } from 'next/server';
import { runScheduledBriefingEmails, sendBriefingEmail } from '@/lib/briefing-email';
import { getAutomationCronSecret } from '@/lib/briefing-config';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = Number(searchParams.get('scheduleId') || '0');

    if (scheduleId > 0) {
      const result = await sendBriefingEmail(scheduleId, 'manual');
      return NextResponse.json({ ok: true, mode: 'manual', scheduleId, result });
    }

    const requestToken = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const automationCronSecret = await getAutomationCronSecret();
    const validTokens = [cronSecret, automationCronSecret]
      .filter((value): value is string => Boolean(value))
      .map((value) => `Bearer ${value}`);

    if (validTokens.length > 0 && (!requestToken || !validTokens.includes(requestToken))) {
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
