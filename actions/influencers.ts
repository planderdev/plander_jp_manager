'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ChannelType, ContactStatus, Gender } from '@/types/db';
import { saveInfluencerMediaConfig } from '@/lib/briefing-config';
import { setFlashMessage } from '@/lib/flash';

function parsePayload(fd: FormData) {
  const rawAge = String(fd.get('age') || '').trim();
  const rawGender = String(fd.get('gender') || '').trim();
  return {
    channel: String(fd.get('channel') || 'instagram') as ChannelType,
    handle: String(fd.get('handle') || ''),
    line_id: String(fd.get('line_id') || '').trim() || null,
    followers: Number(fd.get('followers')) || 0,
    account_url: String(fd.get('account_url') || '') || null,
    unit_price: Number(fd.get('unit_price')) || null,
    memo: String(fd.get('memo') || '') || null,
    name_en: String(fd.get('name_en') || '').toUpperCase().replace(/[^A-Z ]/g, '') || null,
    bank_name: String(fd.get('bank_name') || '').toUpperCase().replace(/[^A-Z ]/g, '') || null,
    branch_name: String(fd.get('branch_name') || '').toUpperCase().replace(/[^A-Z ]/g, '') || null,
    account_number: String(fd.get('account_number') || '').replace(/\D/g, '') || null,
    phone: String(fd.get('phone') || '') || null,
    postal_code: String(fd.get('postal_code') || '').replace(/\D/g, '') || null,
    prefecture: String(fd.get('prefecture') || '') || null,
    city: String(fd.get('city') || '') || null,
    street: String(fd.get('street') || '') || null,
    age: rawAge ? Number(rawAge) || null : null,
    gender: (rawGender || null) as Gender | null,
    contact_status: String(fd.get('contact_status') || 'active') as ContactStatus,
  };
}

export async function createInfluencerAction(fd: FormData) {
  const sb = await createClient();
  const { data: inserted, error } = await sb.from('influencers').insert(parsePayload(fd)).select('id').single();
  if (error) {
    if (error.code === '23505') throw new Error('이미 등록된 인플루언서 아이디입니다');
    throw new Error(error.message);
  }

  if (inserted) {
    const screenshot = fd.get('profile_screenshot') as File | null;
    if (screenshot && screenshot.size > 0) {
      const path = `influencer-screenshots/${inserted.id}/${Date.now()}_${screenshot.name}`;
      const { error: uploadError } = await sb.storage.from('contracts').upload(path, screenshot, { upsert: true });
      if (!uploadError) {
        await saveInfluencerMediaConfig(inserted.id, { profileScreenshotPath: path });
      }
    }
  }

  await setFlashMessage({ title: '작업 완료', body: '인플루언서를 등록했어.' });
  revalidatePath('/influencers');
  redirect('/influencers');
}

export async function updateInfluencerAction(fd: FormData) {
  const sb = await createClient();
  const id = Number(fd.get('id'));
  const { error } = await sb.from('influencers').update(parsePayload(fd)).eq('id', id);
  if (error) throw new Error(error.message);

  const removeScreenshot = String(fd.get('remove_profile_screenshot') || '') === 'on';
  if (removeScreenshot) {
    await saveInfluencerMediaConfig(id, { profileScreenshotPath: null });
  }

  const screenshot = fd.get('profile_screenshot') as File | null;
  if (screenshot && screenshot.size > 0) {
    const path = `influencer-screenshots/${id}/${Date.now()}_${screenshot.name}`;
    const { error: uploadError } = await sb.storage.from('contracts').upload(path, screenshot, { upsert: true });
    if (!uploadError) {
      await saveInfluencerMediaConfig(id, { profileScreenshotPath: path });
    }
  }

  await setFlashMessage({ title: '작업 완료', body: '인플루언서 정보를 저장했어.' });
  revalidatePath('/influencers');
  redirect('/influencers');
}

export async function deleteInfluencerAction(id: number) {
  const sb = await createClient();
  const { error } = await sb.from('influencers').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await setFlashMessage({ title: '작업 완료', body: '인플루언서를 삭제했어.' });
  revalidatePath('/influencers');
}
