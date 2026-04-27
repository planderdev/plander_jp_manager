import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function koreaTodayRange() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts: Record<string, string> = {};

  for (const part of formatter.formatToParts(new Date())) {
    if (part.type !== 'literal') {
      parts[part.type] = part.value;
    }
  }

  const today = `${parts.year}-${parts.month}-${parts.day}`;
  const base = new Date(`${today}T00:00:00+09:00`);
  const tomorrow = new Date(base.getTime() + 24 * 60 * 60 * 1000);
  const toYmd = (value: Date) => {
    const nextParts: Record<string, string> = {};
    for (const part of formatter.formatToParts(value)) {
      if (part.type !== 'literal') {
        nextParts[part.type] = part.value;
      }
    }
    return `${nextParts.year}-${nextParts.month}-${nextParts.day}`;
  };

  return {
    start: `${today}T00:00:00+09:00`,
    end: `${toYmd(tomorrow)}T00:00:00+09:00`,
  };
}

export async function GET(request: Request) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const applicationsSince = searchParams.get('applicationsSince');
  const admin = createAdminClient();
  const { start, end } = koreaTodayRange();

  const [{ count: newApplicantCount }, { data: latestApplicationRow }, { count: todayScheduleCount }] = await Promise.all([
    admin
      .from('influencer_applications')
      .select('id', { count: 'exact', head: true })
      .gt('created_at', applicationsSince || '1970-01-01T00:00:00.000Z')
      .in('status', ['pending']),
    admin
      .from('influencer_applications')
      .select('id, created_at, account_id, platform, status')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('schedules')
      .select('id', { count: 'exact', head: true })
      .gte('scheduled_at', start)
      .lt('scheduled_at', end),
  ]);

  return NextResponse.json({
    ok: true,
    applications: {
      newCount: newApplicantCount ?? 0,
      latestCreatedAt: latestApplicationRow?.created_at ?? null,
      latestAccountId: latestApplicationRow?.account_id ?? null,
      latestPlatform: latestApplicationRow?.platform ?? null,
      latestStatus: latestApplicationRow?.status ?? null,
    },
    todaySchedules: {
      count: todayScheduleCount ?? 0,
    },
  });
}
