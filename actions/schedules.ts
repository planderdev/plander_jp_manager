'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { setFlashMessage } from '@/lib/flash';

function parseRequiredScheduleFields(fd: FormData) {
  const scheduledAt = String(fd.get('scheduled_at') || '');
  const clientId = Number(fd.get('client_id'));
  const influencerId = Number(fd.get('influencer_id'));
  const returnTo = String(fd.get('return_to') || '/campaigns/schedules');

  const missing: string[] = [];
  if (!influencerId) missing.push('인플루언서');
  if (!clientId) missing.push('업체');
  if (!scheduledAt) missing.push('날짜');

  return {
    scheduledAt,
    clientId,
    influencerId,
    returnTo,
    missing,
  };
}

async function redirectForMissingFields(returnTo: string, missing: string[]) {
  await setFlashMessage({
    title: '입력 확인',
    body: `필수 항목을 먼저 선택해 주세요. (${missing.join(', ')})`,
  });
  redirect(returnTo || '/campaigns/schedules');
}

export async function createScheduleAction(fd: FormData) {
  const sb = await createClient();
  const { scheduledAt, clientId, influencerId, returnTo, missing } = parseRequiredScheduleFields(fd);
  if (missing.length) {
    await redirectForMissingFields(returnTo, missing);
  }
  const payload = {
    scheduled_at: scheduledAt,
    client_id: clientId,
    influencer_id: influencerId,
    provided_menu: String(fd.get('provided_menu') || '') || null,
    additional_requests: String(fd.get('additional_requests') || '') || null,
    memo: String(fd.get('memo') || '') || null,
  };
  const { error } = await sb.from('schedules').insert(payload);
  if (error) throw new Error(error.message);
  await setFlashMessage({ title: '작업 완료', body: '스케줄이 등록되었습니다.' });
  revalidatePath('/campaigns/schedules');
  redirect('/campaigns/schedules');
}

export async function deleteScheduleAction(id: number) {
  'use server';
  const sb = await createClient();
  const { error } = await sb.from('schedules').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await setFlashMessage({ title: '작업 완료', body: '스케줄이 삭제되었습니다.' });
  revalidatePath('/campaigns/schedules');
}

export async function updateScheduleAction(fd: FormData) {
  const sb = await createClient();
  const id = Number(fd.get('id'));
  const { scheduledAt, clientId, influencerId, returnTo, missing } = parseRequiredScheduleFields(fd);
  if (missing.length) {
    await redirectForMissingFields(returnTo, missing);
  }
  const payload = {
    scheduled_at: scheduledAt,
    client_id: clientId,
    influencer_id: influencerId,
    provided_menu: String(fd.get('provided_menu') || '') || null,
    additional_requests: String(fd.get('additional_requests') || '') || null,
    memo: String(fd.get('memo') || '') || null,
  };
  const { error } = await sb.from('schedules').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
  await setFlashMessage({ title: '작업 완료', body: '스케줄이 수정되었습니다.' });
  revalidatePath('/campaigns/schedules');
  redirect('/campaigns/schedules');
}
