'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { setFlashMessage } from '@/lib/flash';
import { sendScheduleCreatedPush } from '@/lib/push-notifications';

export async function createScheduleAction(fd: FormData) {
  const sb = await createClient();
  const payload = {
    scheduled_at: String(fd.get('scheduled_at')),
    client_id: Number(fd.get('client_id')),
    influencer_id: Number(fd.get('influencer_id')),
    provided_menu: String(fd.get('provided_menu') || '') || null,
    additional_requests: String(fd.get('additional_requests') || '') || null,
    memo: String(fd.get('memo') || '') || null,
  };
  const { data, error } = await sb.from('schedules').insert(payload).select('id').single();
  if (error) throw new Error(error.message);
  if (data?.id) {
    try {
      await sendScheduleCreatedPush(data.id);
    } catch (pushError) {
      console.error('schedule push notification failed', { scheduleId: data.id, pushError });
    }
  }
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
  const payload = {
    scheduled_at: String(fd.get('scheduled_at')),
    client_id: Number(fd.get('client_id')),
    influencer_id: Number(fd.get('influencer_id')),
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
