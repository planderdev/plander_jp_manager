import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getScheduleStatus } from '@/lib/schedule-status';

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
    if (diff > 366) rangeError = '조회수 기간은 최대 1년까지 가능합니다';
    if (diff < 0) rangeError = '종료일이 시작일보다 빠릅니다';
  }

  let posts: any[] = [];
  let reserved = 0, uploadPending = 0, settlementPending = 0, scheduleDone = 0;
  let involvedInfluencers = 0;  // ← 추가

  if (!rangeError) {
    let q = sb.from('posts')
      .select('client_id, influencer_id, post_url, views, likes, comments, created_at, settlement_status, influencers(unit_price)');
    if (client) q = q.eq('client_id', Number(client));
    if (influencer) q = q.eq('influencer_id', Number(influencer));
    if (fromDate) q = q.gte('created_at', `${fromDate}T00:00:00+09:00`);
    if (toDate) q = q.lte('created_at', `${toDate}T23:59:59+09:00`);
    const { data } = await q; posts = data ?? [];

    let sq = sb.from('schedules')
      .select('*, posts(post_url, settlement_status)');
    if (client) sq = sq.eq('client_id', Number(client));
    if (influencer) sq = sq.eq('influencer_id', Number(influencer));
    if (fromDate) sq = sq.gte('scheduled_at', `${fromDate}T00:00:00+09:00`);
    if (toDate) sq = sq.lte('scheduled_at', `${toDate}T23:59:59+09:00`);
    const { data: schedulesData } = await sq;
    
    for (const s of schedulesData ?? []) {
      const st = getScheduleStatus(s.scheduled_at, s.posts);
      if (st === 'reserved') reserved++;
      else if (st === 'upload_pending') uploadPending++;
      else if (st === 'settlement_pending') settlementPending++;
      else if (st === 'done') scheduleDone++;
    }
    // 참여 인플루언서: 해당 기간 schedules에 들어간 unique influencer
    const involvedSet = new Set<number>();
    for (const s of schedulesData ?? []) {
      if (s.influencer_id) involvedSet.add(s.influencer_id);
    }
    involvedInfluencers = involvedSet.size;
  }

  // 전월 대비 (필터 무관)
  const now = new Date();
  const isLastDay = now.getDate() === new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // 말일이면 이번달, 아니면 전월 기준
  const baseDate = isLastDay
    ? now
    : new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const thisMonth = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  
  const { data: thisHist } = await sb.from('post_metrics_history').select('*').eq('month', thisMonth);
  const { data: prevHist } = await sb.from('post_metrics_history').select('*').eq('month', prevMonth);
  
  const sumKey = (arr: any[], k: string) => arr?.reduce((a, r) => a + (r[k] ?? 0), 0) ?? 0;
  const tv = sumKey(thisHist ?? [], 'views');
  const pv = sumKey(prevHist ?? [], 'views');
  const tl = sumKey(thisHist ?? [], 'likes');
  const pl = sumKey(prevHist ?? [], 'likes');
  const tc = sumKey(thisHist ?? [], 'comments');
  const pc = sumKey(prevHist ?? [], 'comments');
  const ts = sumKey(thisHist ?? [], 'shares');
  const ps = sumKey(prevHist ?? [], 'shares');
  
  function delta(cur: number, prev: number): string {
    if (prev === 0) return cur > 0 ? '+신규' : '-';
    const diff = cur - prev;
    const pct = ((diff / prev) * 100).toFixed(1);
    return `${diff >= 0 ? '+' : ''}${diff.toLocaleString()} (${pct}%)`;
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
  const paidTotal = posts
    .filter((p: any) => p.settlement_status === 'done')
    .reduce((a, p: any) => a + (p.influencers?.unit_price ?? 0), 0) * 10;
  const unpaidTotal = posts
    .filter((p: any) => p.settlement_status !== 'done')
    .reduce((a, p: any) => a + (p.influencers?.unit_price ?? 0), 0) * 10;
  const grandTotal = paidTotal + unpaidTotal;

  const metrics: { label: string; value: number; href?: string; suffix?: string }[] = [
    { label: '업체 수', value: totalClients },
    { label: '인플루언서 수', value: totalInfluencers },
    { label: '참여 인플루언서', value: involvedInfluencers },
    { label: '업로드 게시물 수', value: uploaded },
    { label: '총 좋아요수', value: totalLikes },
    { label: '총 댓글수', value: totalComments },
    { label: '총 조회수', value: totalViews },
    { label: '정산 완료 금액', value: paidTotal, suffix: '원', href: '/influencers/posts' },
    { label: '미정산 금액', value: unpaidTotal, suffix: '원', href: '/influencers/posts' },
    { label: '총 지출 금액', value: grandTotal, suffix: '원', href: '/influencers/posts' },
    { label: '방문예정', value: reserved, href: '/campaigns/schedules' },
    { label: '업로드 대기', value: uploadPending, href: '/campaigns/schedules' },
    { label: '정산 대기', value: settlementPending, href: '/influencers/posts' },
    { label: '완료', value: scheduleDone, href: '/campaigns/completed' },
    { label: `${thisMonth} 조회수수`, value: tv },
    { label: `${thisMonth} 좋아요수`, value: tl },
    { label: `${thisMonth} 댓글수`, value: tc },
    { label: `${thisMonth} 공유수`, value: ts },
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
        <button className="bg-black text-white px-4 py-2 rounded text-sm">조회수</button>
      </form>

      {rangeError && <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded text-sm">{rangeError}</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((m) => {
          const inner = (
            <>
              <div className="text-sm text-gray-600">{m.label}</div>
              <div className="text-2xl md:text-3xl font-bold mt-1">
                {m.value.toLocaleString()}{m.suffix ?? ''}
              </div>
            </>
          );
          return m.href ? (
            <Link key={m.label} href={m.href}
              className="bg-white rounded-lg shadow p-5 hover:shadow-md transition">
              {inner}
            </Link>
          ) : (
            <div key={m.label} className="bg-white rounded-lg shadow p-5">
              {inner}
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-lg font-semibold mb-4">{thisMonth} (전월 {prevMonth} 대비)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">조회수수</div>
            <div className="text-2xl font-bold">{tv.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{delta(tv, pv)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">좋아요수</div>
            <div className="text-2xl font-bold">{tl.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{delta(tl, pl)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">댓글수</div>
            <div className="text-2xl font-bold">{tc.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{delta(tc, pc)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">공유수</div>
            <div className="text-2xl font-bold">{ts.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{delta(ts, ps)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}