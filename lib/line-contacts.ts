import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

type LineProfile = {
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
};

type LineContactInput = {
  lineUserId: string;
  sourceType?: string | null;
  eventType?: string | null;
  messageText?: string | null;
  channelAccessToken?: string | null;
};

export type LineContactUpsertResult = {
  created: boolean;
  displayName: string | null;
  lineUserId: string;
  messageText: string | null;
};

async function getLineProfile(userId: string, channelAccessToken?: string | null): Promise<LineProfile | null> {
  if (!channelAccessToken) return null;

  try {
    const response = await fetch(`https://api.line.me/v2/bot/profile/${encodeURIComponent(userId)}`, {
      headers: {
        Authorization: `Bearer ${channelAccessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    return (await response.json()) as LineProfile;
  } catch {
    return null;
  }
}

export async function upsertLineContactFromWebhook(input: LineContactInput) {
  const sb = createAdminClient();
  const [{ data: existing }, profile] = await Promise.all([
    sb
      .from('line_contacts')
      .select('id')
      .eq('line_user_id', input.lineUserId)
      .maybeSingle(),
    getLineProfile(input.lineUserId, input.channelAccessToken),
  ]);
  const now = new Date().toISOString();

  await sb.from('line_contacts').upsert({
    line_user_id: input.lineUserId,
    source_type: input.sourceType ?? null,
    display_name: profile?.displayName ?? null,
    picture_url: profile?.pictureUrl ?? null,
    status_message: profile?.statusMessage ?? null,
    last_message_text: input.messageText ?? null,
    last_event_type: input.eventType ?? null,
    last_received_at: now,
    updated_at: now,
  }, { onConflict: 'line_user_id' });

  return {
    created: !existing,
    displayName: profile?.displayName ?? null,
    lineUserId: input.lineUserId,
    messageText: input.messageText ?? null,
  } satisfies LineContactUpsertResult;
}

export function normalizeLineMatchValue(value?: string | null) {
  return String(value ?? '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[\s._-]+/g, '');
}
