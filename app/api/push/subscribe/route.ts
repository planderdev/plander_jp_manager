import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { upsertWebPushSubscription, deleteWebPushSubscription, getWebPushStatus } from '@/lib/web-push';

export const runtime = 'nodejs';

type SubscriptionPayload = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

type ValidSubscriptionPayload = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

async function requireUser() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

function isValidSubscription(value: unknown): value is ValidSubscriptionPayload {
  if (!value || typeof value !== 'object') return false;
  const subscription = value as SubscriptionPayload;
  return Boolean(
    subscription.endpoint &&
    subscription.keys?.p256dh &&
    subscription.keys?.auth
  );
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subscription, locale } = await request.json() as { subscription?: unknown; locale?: string | null };
  if (!isValidSubscription(subscription)) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  const status = await getWebPushStatus();
  if (!status.configured) {
    return NextResponse.json({ error: 'Web push is not configured' }, { status: 503 });
  }

  await upsertWebPushSubscription({
    subscription,
    locale: typeof locale === 'string' ? locale : null,
    userAgent: request.headers.get('user-agent'),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { endpoint } = await request.json() as { endpoint?: string };
  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
  }

  await deleteWebPushSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
