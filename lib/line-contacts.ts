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
  const profile = await getLineProfile(input.lineUserId, input.channelAccessToken);
  const sb = createAdminClient();
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
}

export function normalizeLineMatchValue(value?: string | null) {
  return String(value ?? '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[\s._-]+/g, '');
}
