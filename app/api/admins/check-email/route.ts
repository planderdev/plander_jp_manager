import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim().toLowerCase() ?? '';

  if (!email) {
    return NextResponse.json({ ok: false, message: 'Email is required' }, { status: 400 });
  }

  const { data } = await sb
    .from('admins')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    email,
    available: !data,
  });
}
