'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getDeliverySettings, getLineWebhookStatus, parseDeliverySettingsFormData, saveDeliverySettings } from '@/lib/briefing-config';
import { setFlashMessage } from '@/lib/flash';

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

  await setFlashMessage({ title: '작업 완료', body: 'Apify 설정이 저장되었습니다.' });
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

export async function saveDeliverySettingsAction(fd: FormData) {
  await saveDeliverySettings(parseDeliverySettingsFormData(fd));
  await setFlashMessage({ title: '작업 완료', body: '전송 설정이 저장되었습니다.' });
  revalidatePath('/extras/admins');
}

export async function getDeliverySettingsStatus() {
  return getDeliverySettings();
}

export async function getLineWebhookStatusAction() {
  return getLineWebhookStatus();
}
