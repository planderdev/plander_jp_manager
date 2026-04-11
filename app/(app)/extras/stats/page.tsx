import { createClient } from '@/lib/supabase/server';

function parseYmd(s?: string) {
  if (!s) return null;
  const c = s.replace(/\D/g, '');
  if (c.length !== 8) return null;
  return `${c.slice(0,4)}-${c.slice(4,6)}-${c.slice(6,8)}`;
}

export default async function StatsPage({
  searchParams,
}: { searchParams: Promise<{ client?: string; influencer?: string; from?: string; to?: string }> }) {
  const { client, influencer, from, to } = await searchParams;
  const sb = await createClient();

  const [{ data: clients }, { data: influencers }] = await Promise.all([
    sb.from('clients').select('id, company_name').order('company_name'),
    sb.from('influencers').select('id, handle').order('handle'),
  ]);

  const fromDate = parseYmd(from);
  const toDate = parseYmd(to);

  // 1년 제한
  let rangeError = '';
  if (fromDate && toDate) {
    const diff = (new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000*60*60*24);
    if (diff > 366) rangeError = '조회 기간은 최대 1년까지 가능합니다';
    if (diff < 0) rangeError = '종료일이 시작일보다 빠릅니다';
  }

  let posts: any[] = [];
  if (!rangeError) {
    let q = sb.from('posts')
      .select('client_id, influencer_id, post_url, views, likes, comments, created_at');
    if (client) q = q.eq('client_id', Number(client));
    if (influencer) q = q.eq('influencer_id', Number(influencer));
    if (fromDate) q = q.gte('created_at', `${fromDate}T00:00:00+09:00`);
    if (toDate) q = q.lte('created_at', `${toDate}T23:59:59+09:00`);
    const { data } = await q;
    posts = data ?? [];
  }

  // 필터 적용된 카운트
  let totalClients: number;
  let totalInfluencers: number;

  if (client) {
    totalClients = 1;
  } else {
    const { count } = await sb.from('clients').select('id', { count: 'exact', head: true });
    totalClients = count ?? 0;
  }
  
  if (influencer) {
    totalInfluencers = 1;
  } else {
    const { count } = await sb.from('influencers').select('id', { count: 'exact', head: true });
    totalInfluencers = count ?? 0;
  }
  const uploaded = posts.filter(p => p.post_url).length;
  const totalViews = posts.reduce((a, p) => a + (p.views ?? 0), 0);
  const totalLikes = posts.reduce((a, p) => a + (p.likes ?? 0), 0);
  const totalComments = posts.reduce((a, p) => a + (p.comments ?? 0), 0);

  const metrics = [
    { label: '업체 수', value: totalClients },
    { label: '인플루언서 수', value: totalInfluencers },
    { label: '업로드 게시물 수', value: uploaded },
    { label: '총 좋아요', value: totalLikes },
    { label: '총 댓글', value: totalComments },
    { label: '총 조회수', value: totalViews },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold">리포트 (내부 통계)</h1>

      <form className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm block mb-1 font-medium">업체</label>
          <select name="client" defaultValue={client ?? ''} className="border border-gray-400 rounded p-2 text-sm">
            <option value="">전체</option>
            {clients?.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">인플루언서</label>
          <select name="influencer" defaultValue={influencer ?? ''} className="border border-gray-400 rounded p-2 text-sm">
            <option value="">전체</option>
            {influencers?.map((i) => <option key={i.id} value={i.id}>@{i.handle}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">시작일</label>
          <input type="date" name="from" defaultValue={fromDate ?? ''} className="border border-gray-400 rounded p-2 text-sm" />
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">종료일</label>
          <input type="date" name="to" defaultValue={toDate ?? ''} className="border border-gray-400 rounded p-2 text-sm" />
        </div>
        <button className="bg-black text-white px-4 py-2 rounded text-sm">조회</button>
      </form>

      {rangeError && <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded text-sm">{rangeError}</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-lg shadow p-5">
            <div className="text-sm text-gray-600">{m.label}</div>
            <div className="text-3xl font-bold mt-1">{m.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}