import { NextResponse } from 'next/server';

import { getApplicantWebhookSecret, sendWebPushNotification } from '@/lib/web-push';

export const runtime = 'nodejs';

type ApplicantWebhookPayload = {
  record?: {
    account_id?: string | null;
    platform?: string | null;
    status?: string | null;
  } | null;
};

export async function POST(request: Request) {
  const secret = request.headers.get('x-push-webhook-secret');
  const expectedSecret = await getApplicantWebhookSecret();

  if (!secret || !expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json() as ApplicantWebhookPayload;
  const record = payload.record;

  if (!record || (record.status && record.status !== 'pending')) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const handle = String(record.account_id ?? '').trim();
  const platform = String(record.platform ?? '').trim();

  const result = await sendWebPushNotification((locale) => ({
    title: locale === 'ja' ? '新規Web応募' : '웹 신청자 신규 접수',
    body:
      locale === 'ja'
        ? [platform, handle].filter(Boolean).join(' / ') || '新規応募が届きました。'
        : [platform, handle].filter(Boolean).join(' / ') || '신규 신청이 들어왔습니다.',
    url: '/influencers/applications',
    tag: 'influencer-applications',
  }));

  return NextResponse.json({ ok: true, ...result });
}
