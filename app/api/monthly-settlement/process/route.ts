import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processMonthlySettlementReport } from '@/lib/monthly-settlement-processing';

export async function POST(request: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { reportId?: number } | null;
  const reportId = Number(body?.reportId);
  if (!Number.isFinite(reportId)) {
    return NextResponse.json({ error: 'Invalid report id' }, { status: 400 });
  }

  try {
    const result = await processMonthlySettlementReport(reportId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Processing failed' }, { status: 500 });
  }
}
