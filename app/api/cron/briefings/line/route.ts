import { NextResponse } from 'next/server';
import { runScheduledBriefingLineMessages } from '@/lib/briefing-email';
import { getAutomationCronSecret } from '@/lib/briefing-config';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const requestToken = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const automationCronSecret = await getAutomationCronSecret();
    const validTokens = [cronSecret, automationCronSecret]
      .filter((value): value is string => Boolean(value))
      .map((value) => `Bearer ${value}`);

    if (validTokens.length > 0 && (!requestToken || !validTokens.includes(requestToken))) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const result = await runScheduledBriefingLineMessages();
    return NextResponse.json({ ok: true, mode: 'scheduled', ...result });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'unknown_error' },
      { status: 500 }
    );
  }
}
