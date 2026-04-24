import { NextResponse } from 'next/server';
import { runScheduledBriefingLineMessages } from '@/lib/briefing-email';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
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
