import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { sendWebPushNotification } from '@/lib/web-push';

export const runtime = 'nodejs';

async function requireUser() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function POST() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sendWebPushNotification((locale) => ({
    title: locale === 'ja' ? 'Plander プッシュテスト' : 'Plander 웹푸시 테스트',
    body: locale === 'ja' ? 'スマホ通知のテスト送信です。' : '휴대폰 알림 테스트 발송입니다.',
    url: '/extras/admins',
    tag: 'web-push-test',
  }));

  return NextResponse.json(result);
}
