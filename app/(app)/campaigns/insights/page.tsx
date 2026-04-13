import { createClient } from '@/lib/supabase/server';

export default async function InsightsPage({
  searchParams,
}: { searchParams: Promise<{ client?: string; from?: string; to?: string }> }) {
  const { client, from, to } = await searchParams;
  const sb = await createClient();

  const { data: clients } = await sb.from('clients').select('id, company_name').order('company_name');

  function parseYmd(s?: string) {
    if (!s) return null;
    const clean = s.replace(/\D/g, '');
    if (clean.length !== 8) return null;
    return `${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}`;
  }
  const fromDate = parseYmd(from);
  const toDate = parseYmd(to);

  let query = sb.from('posts')
    .select('*, influencers(id)', { count: 'exact' });
  if (client) query = query.eq('client_id', Number(client));
  if (fromDate) query = query.gte('created_at', fromDate);
  if (toDate) query = query.lte('created_at', toDate + 'T23:59:59');

  const { data: posts } = await query;

  const totalPosts = posts?.length ?? 0;
  const uploaded = posts?.filter((p: any) => p.post_url).length ?? 0;
  const totalViews = posts?.reduce((s: number, p: any) => s + (p.views ?? 0), 0) ?? 0;
  const totalLikes = posts?.reduce((s: number, p: any) => s + (p.likes ?? 0), 0) ?? 0;
  const totalComments = posts?.reduce((s: number, p: any) => s + (p.comments ?? 0), 0) ?? 0;
  const uniqueInfluencers = new Set(posts?.map((p: any) => p.influencer_id)).size;

  const metrics = [
    { label: '총 게시물', value: totalPosts },
    { label: '업로드 완료', value: uploaded },
    { label: '총 조회수', value: totalViews },
    { label: '총 좋아요', value: totalLikes },
    { label: '총 댓글', value: totalComments },
    { label: '총 공유', value: posts?.reduce((s: number, p: any) => s + (p.shares ?? 0), 0) ?? 0 },
    { label: '참여 인플루언서', value: uniqueInfluencers },
  ];

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">인사이트</h1>

      <form className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm block mb-1 font-medium">업체</label>
          <select name="client" defaultValue={client ?? ''} className="border border-gray-400 rounded p-2 text-sm">
            <option value="">전체</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">시작일 (YYYYMMDD)</label>
          <input name="from" defaultValue={from ?? ''} placeholder="20260101"
            className="border border-gray-400 rounded p-2 text-sm w-32" />
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">종료일 (YYYYMMDD)</label>
          <input name="to" defaultValue={to ?? ''} placeholder="20260430"
            className="border border-gray-400 rounded p-2 text-sm w-32" />
        </div>
        <button className="bg-black text-white px-4 py-2 rounded text-sm">조회</button>
      </form>

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