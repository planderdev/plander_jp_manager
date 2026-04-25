'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { setFlashMessage } from '@/lib/flash';

export async function linkLineContactAction(formData: FormData) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const contactId = Number(formData.get('contact_id'));
  const influencerId = Number(formData.get('influencer_id'));
  const lineUserId = String(formData.get('line_user_id') || '').trim();
  if (!contactId || !influencerId || !lineUserId) throw new Error('필수값 누락');

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [{ error: influencerError }, { error: contactError }] = await Promise.all([
    admin.from('influencers').update({ line_id: lineUserId, updated_at: now }).eq('id', influencerId),
    admin.from('line_contacts').update({ linked_influencer_id: influencerId, linked_at: now, updated_at: now }).eq('id', contactId),
  ]);

  if (influencerError) throw new Error(influencerError.message);
  if (contactError) throw new Error(contactError.message);

  await setFlashMessage({ title: '작업 완료', body: 'LINE 계정이 연결되었습니다.' });
  revalidatePath('/extras/line-contacts');
  revalidatePath('/influencers');
}

export async function unlinkLineContactAction(formData: FormData) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const contactId = Number(formData.get('contact_id'));
  const influencerId = Number(formData.get('influencer_id'));
  const lineUserId = String(formData.get('line_user_id') || '').trim();
  if (!contactId) throw new Error('필수값 누락');

  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin.from('line_contacts').update({ linked_influencer_id: null, linked_at: null, updated_at: now }).eq('id', contactId);

  if (influencerId && lineUserId) {
    await admin.from('influencers').update({ line_id: null, updated_at: now }).eq('id', influencerId).eq('line_id', lineUserId);
  }

  await setFlashMessage({ title: '작업 완료', body: 'LINE 연결이 해제되었습니다.' });
  revalidatePath('/extras/line-contacts');
  revalidatePath('/influencers');
}
