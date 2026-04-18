'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
  const { error } = await sb.from('schedules').insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath('/campaigns/schedules');
  redirect('/campaigns/schedules');
}

export async function deleteScheduleAction(id: number) {
  'use server';
  const sb = await createClient();
  const { error } = await sb.from('schedules').delete().eq('id', id);
  if (error) throw new Error(error.message);
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
  revalidatePath('/campaigns/schedules');
  redirect('/campaigns/schedules');
}
