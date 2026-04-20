import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getWebPushStatus } from '@/lib/web-push';

export const runtime = 'nodejs';

async function requireUser() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = await getWebPushStatus();
  return NextResponse.json(status);
}
