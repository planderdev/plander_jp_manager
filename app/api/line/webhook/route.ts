import { createHmac, timingSafeEqual } from 'crypto';

import { NextResponse } from 'next/server';

import { getDeliverySettings, markLineWebhookReceived } from '@/lib/briefing-config';
import { upsertLineContactFromWebhook } from '@/lib/line-contacts';

type LineWebhookEvent = {
  type?: string;
  message?: {
    type?: string;
    text?: string;
  };
  source?: {
    type?: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
};

type LineWebhookBody = {
  destination?: string;
  events?: LineWebhookEvent[];
};

function verifyLineSignature(body: string, signature: string, secret: string) {
  const digest = createHmac('sha256', secret).update(body).digest('base64');
  const expected = Buffer.from(digest);
  const received = Buffer.from(signature);

  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

function getSourceId(event?: LineWebhookEvent) {
  return event?.source?.userId ?? event?.source?.groupId ?? event?.source?.roomId ?? null;
}

export async function GET() {
  return NextResponse.json({ ok: true, route: 'line-webhook' });
}

export async function POST(request: Request) {
  const bodyText = await request.text();
  const signature = request.headers.get('x-line-signature') ?? '';
  const settings = await getDeliverySettings();

  if (!settings.lineChannelSecret) {
    return NextResponse.json({ ok: false, message: 'LINE channel secret is not configured.' }, { status: 500 });
  }

  if (!signature || !verifyLineSignature(bodyText, signature, settings.lineChannelSecret)) {
    return NextResponse.json({ ok: false, message: 'Invalid LINE signature.' }, { status: 401 });
  }

  let payload: LineWebhookBody = {};
  try {
    payload = JSON.parse(bodyText) as LineWebhookBody;
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON payload.' }, { status: 400 });
  }

  const firstEvent = payload.events?.[0];
  const sourceId = getSourceId(firstEvent);
  await markLineWebhookReceived({
    lastReceivedAt: new Date().toISOString(),
    lastEventType: firstEvent?.type ?? (payload.events?.length ? 'multiple' : 'verify'),
    lastSourceType: firstEvent?.source?.type ?? null,
    lastSourceId: sourceId,
    lastMessageText: firstEvent?.message?.type === 'text' ? firstEvent.message.text ?? null : null,
  });

  if (sourceId && firstEvent?.source?.type === 'user') {
    await upsertLineContactFromWebhook({
      lineUserId: sourceId,
      sourceType: firstEvent.source.type,
      eventType: firstEvent.type ?? null,
      messageText: firstEvent.message?.type === 'text' ? firstEvent.message.text ?? null : null,
      channelAccessToken: settings.lineChannelAccessToken,
    });
  }

  return NextResponse.json({
    ok: true,
    received: payload.events?.length ?? 0,
  });
}
