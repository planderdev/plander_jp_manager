'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// 해당 월에 입력 가능한 게시물 목록 + 기존 입력값
export async function getMetricsForMonth(month: string) {
  const sb = await createClient();

  const { data: posts } = await sb.from('posts')
    .select('id, post_url, uploaded_on, views, likes, comments, shares, clients(company_name, status), influencers(handle)')
    .not('post_url', 'is', null);

  const targets = (posts ?? []).filter((p: any) => p.clients?.status !== 'ended');

  if (targets.length === 0) return { posts: [], history: [] };

  const ids = targets.map((p: any) => p.id);

  const { data: history } = await sb.from('post_metrics_history')
    .select('*')
    .in('post_id', ids)
    .eq('month', month);

  return { posts: targets, history: history ?? [] };
}

// 월별 메트릭 일괄 저장
export async function saveMetricsForMonth(fd: FormData) {
  const month = String(fd.get('month'));
  if (!month) throw new Error('월 정보가 없습니다');

  const sb = await createClient();

  const entries: { post_id: number; views: number; likes: number; comments: number; shares: number }[] = [];

  const postIds = new Set<number>();
  for (const key of fd.keys()) {
    const m = key.match(/^(views|likes|comments|shares)_(\d+)$/);
    if (m) postIds.add(Number(m[2]));
  }

  for (const pid of postIds) {
    entries.push({
      post_id: pid,
      views: Number(fd.get(`views_${pid}`)) || 0,
      likes: Number(fd.get(`likes_${pid}`)) || 0,
      comments: Number(fd.get(`comments_${pid}`)) || 0,
      shares: Number(fd.get(`shares_${pid}`)) || 0,
    });
  }

  for (const e of entries) {
    await sb.from('post_metrics_history').upsert({
      post_id: e.post_id,
      month,
      views: e.views,
      likes: e.likes,
      comments: e.comments,
      shares: e.shares,
      collected_at: new Date().toISOString(),
      entered_at: new Date().toISOString(),
    }, { onConflict: 'post_id,month' });

    await sb.from('posts').update({
      views: e.views,
      likes: e.likes,
      comments: e.comments,
      shares: e.shares,
      last_synced_at: new Date().toISOString(),
    }).eq('id', e.post_id);
  }

  revalidatePath('/influencers/posts/metrics');
  revalidatePath('/influencers/posts');
}