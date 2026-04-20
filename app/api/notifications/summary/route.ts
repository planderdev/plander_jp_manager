import { NextResponse } from 'next/server';

import { getBriefEmailEventsSince } from '@/lib/briefing-config';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

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
  const emailsSince = searchParams.get('emailsSince');
  const admin = createAdminClient();

  const [{ count: newApplicantCount }, { data: latestApplicationRow }, emailEvents] = await Promise.all([
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
    getBriefEmailEventsSince(emailsSince),
  ]);

  const latestEmailEvent = emailEvents[0] ?? null;
  let latestEmailLabel: string | null = null;

  if (latestEmailEvent?.scheduleId) {
    const { data: schedule } = await admin
      .from('schedules')
      .select('id, clients(company_name), influencers(handle)')
      .eq('id', latestEmailEvent.scheduleId)
      .maybeSingle();

    if (schedule) {
      const clientName = (schedule as any).clients?.company_name ?? '업체';
      const influencerHandle = (schedule as any).influencers?.handle ?? 'influencer';
      latestEmailLabel = `${clientName} · @${influencerHandle}`;
    }
  }

  return NextResponse.json({
    ok: true,
    applications: {
      newCount: newApplicantCount ?? 0,
      latestCreatedAt: latestApplicationRow?.created_at ?? null,
      latestAccountId: latestApplicationRow?.account_id ?? null,
      latestPlatform: latestApplicationRow?.platform ?? null,
      latestStatus: latestApplicationRow?.status ?? null,
    },
    briefEmails: {
      newCount: emailEvents.length,
      latestSentAt: latestEmailEvent?.sentAt ?? null,
      latestMode: latestEmailEvent?.mode ?? null,
      latestRecipient: latestEmailEvent?.recipient ?? null,
      latestLabel: latestEmailLabel,
    },
  });
}
