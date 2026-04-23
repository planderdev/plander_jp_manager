'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function parseYmd(s: string | null): string | null {
  if (!s) return null;
  const clean = s.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  return `${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}`;
}

export async function upsertPostAction(fd: FormData) {
  const sb = await createClient();
  const id = fd.get('id') ? Number(fd.get('id')) : null;

  const payload = {
    client_id: Number(fd.get('client_id')),
    influencer_id: Number(fd.get('influencer_id')),
    schedule_id: fd.get('schedule_id') ? Number(fd.get('schedule_id')) : null,
    settlement_count: Math.max(1, Number(fd.get('settlement_count')) || 1),
    post_url: String(fd.get('post_url') || '') || null,
    uploaded_on: String(fd.get('uploaded_on') || '') || null,
    settlement_status: String(fd.get('settlement_status') || 'pending') as any,
    settled_on: parseYmd(String(fd.get('settled_on') || '') || null),
  };

  let postId = id;
  if (id) {
    const { error } = await sb.from('posts').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await sb.from('posts').insert(payload).select().single();
    if (error) throw new Error(error.message);
    postId = data.id;
  }

  const file = fd.get('payment_proof') as File | null;
  if (file && file.size > 0 && postId) {
    const path = `${postId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await sb.storage.from('payments').upload(path, file);
    if (!upErr) {
      await sb.from('posts').update({ payment_proof_path: path }).eq('id', postId);
    }
  }

  revalidatePath('/influencers/posts');
  revalidatePath('/campaigns/completed');
  redirect('/influencers/posts');
}

export async function deletePostAction(id: number) {
  const sb = await createClient();
  const { error } = await sb.from('posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/influencers/posts');
}

export async function autoCreatePostsFromPastSchedules() {
  const sb = await createClient();
  const now = new Date().toISOString();

  // 지나간 스케줄 중 posts 연결 없는 것
  const { data: schedules } = await sb.from('schedules')
    .select('id, client_id, influencer_id, posts(id)')
    .lt('scheduled_at', now);

  if (!schedules) return { created: 0 };

  const targets = schedules.filter((s: any) => !s.posts || s.posts.length === 0);
  if (targets.length === 0) return { created: 0 };

  const payload = targets.map((s: any) => ({
    schedule_id: s.id,
    client_id: s.client_id,
    influencer_id: s.influencer_id,
    post_url: null,
    uploaded_on: null,
    settlement_count: 1,
    settlement_status: 'pending' as const,
  }));

  const { error } = await sb.from('posts').insert(payload);
  if (error) console.error('Auto-create posts error:', error.message);

  return { created: targets.length };
}
