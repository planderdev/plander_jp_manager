import { createClient } from '@supabase/supabase-js';
import { scrapeInstagramPosts } from '@/lib/apify';

export async function syncAllPosts() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: posts, error } = await sb.from('posts')
    .select('id, post_url, client_id, clients(status)')
    .not('post_url', 'is', null);

  // 필터
  const targets = (posts ?? []).filter((p: any) => p.clients?.status !== 'ended');

  if (error) throw new Error(error.message);
  if (!posts || posts.length === 0) {
    return { synced: 0, total: 0, message: '갱신 대상 없음' };
  }

  const urls = posts.map(p => p.post_url!).filter(Boolean);
  const metrics = await scrapeInstagramPosts(urls);

  const normalize = (u: string) => {
    const code = u.match(/\/(p|reel|reels)\/([A-Za-z0-9_-]+)/)?.[2] ?? '';
    return code.toLowerCase();
  };

  const metricsByUrl = new Map(metrics.map(m => [normalize(m.url), m]));

  let updated = 0;
  for (const post of targets) {
    const m = metricsByUrl.get(normalize(post.post_url!));
    if (!m) continue;

    // null 이면 기존 값 유지 (수동 입력 보호)
    const updatePayload: any = {
      last_synced_at: new Date().toISOString(),
    };
    if (m.likes !== null) updatePayload.likes = m.likes;
    if (m.comments !== null) updatePayload.comments = m.comments;
    if (m.views !== null && m.views > 0) updatePayload.views = m.views;
    if (m.shares !== null && m.shares !== undefined) updatePayload.shares = m.shares;  // ← 추가

    await sb.from('posts').update(updatePayload).eq('id', post.id);

    // 히스토리는 그날 받은 값 그대로 (null은 0)
    const today = new Date().toISOString().slice(0, 10) + 'T00:00:00Z';
    const currentMonth = new Date().toISOString().slice(0, 7);  // '2026-04'

    await sb.from('post_metrics_history').upsert({
      post_id: post.id,
      month: currentMonth,
      views: m.views ?? 0,
      likes: m.likes ?? 0,
      comments: m.comments ?? 0,
      shares: m.shares ?? 0,
      entered_at: new Date().toISOString(),
    }, { onConflict: 'post_id,month' });

    updated++;
  }

  return { synced: updated, total: posts.length };
}