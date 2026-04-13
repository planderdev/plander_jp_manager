import { createClient } from '@supabase/supabase-js';

export type ScrapedMetrics = {
  url: string;
  likes: number | null;
  comments: number | null;
  views: number | null;
  shares: number | null;
};

const ACTOR_ID = 'apify~instagram-post-scraper';

async function getApifyToken(): Promise<string | null> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await sb.from('app_settings').select('value').eq('key', 'apify_token').single();
  return data?.value || null;
}

export async function scrapeInstagramPosts(urls: string[]): Promise<ScrapedMetrics[]> {
  if (urls.length === 0) return [];

  const token = await getApifyToken();

  // 토큰 없으면 Mock 모드 (덮어쓰기 안 함)
  if (!token) {
    console.log(`[apify mock] ${urls.length}개 URL — 토큰 없음, mock 응답`);
    return urls.map((url) => ({ url, likes: null, comments: null, views: null, shares: null }));
  }

  // 실제 Apify 호출
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directUrls: urls,
          resultsType: 'posts',
          resultsLimit: urls.length,
          addParentData: false,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`Apify error: ${res.status} ${text.slice(0, 200)}`);
      return urls.map((url) => ({ url, likes: null, comments: null, views: null, shares: null }));
    }

    const data = await res.json() as any[];
    return data.map((item) => ({
      url: item.url ?? item.inputUrl ?? '',
      likes: item.likesCount ?? null,
      comments: item.commentsCount ?? null,
      views: item.videoViewCount ?? item.videoPlayCount ?? null,
    }));
  } catch (e: any) {
    console.error('Apify call failed:', e.message);
    return urls.map((url) => ({ url, likes: null, comments: null, views: null, shares: null }));
  }
}