'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveApifyTokenAction(fd: FormData) {
  const token = String(fd.get('apify_token') || '').trim();
  const sb = await createClient();

  if (!token) {
    await sb.from('app_settings').delete().eq('key', 'apify_token');
  } else {
    await sb.from('app_settings').upsert({
      key: 'apify_token',
      value: token,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
  }

  const actorId = String(fd.get('apify_actor_id') || '');
  if (actorId) {
    await sb.from('app_settings').upsert({ key: 'apify_actor_id', value: actorId }, { onConflict: 'key' });
  }

  revalidatePath('/extras/admins');
}

export async function getApifyTokenStatus() {
  const sb = await createClient();
  const { data } = await sb.from('app_settings').select('value, updated_at').eq('key', 'apify_token').single();
  if (!data?.value) return { hasToken: false, masked: '', updatedAt: null };
  const v = data.value;
  const masked = v.length > 8 ? `${v.slice(0, 6)}...${v.slice(-4)}` : '****';
  return { hasToken: true, masked, updatedAt: data.updated_at };
}