import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getScheduleStatus } from '@/lib/schedule-status';
import CollapsibleGroup from '@/components/stats/CollapsibleGroup';
import HideOnPresentation from '@/components/HideOnPresentation';
import { getI18n } from '@/lib/i18n/server';

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
  const { t } = await getI18n();
  const sb = await createClient();

  const [{ data: clients }, { data: influencers }] = await Promise.all([
    sb.from('clients').select('id, company_name').order('company_name'),
    sb.from('influencers').select('id, handle').order('handle'),
  ]);

  const fromDate = parseYmd(from);
  const toDate = parseYmd(to);

  let rangeError = '';
  if (fromDate && toDate) {
    const diff = (new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000*60*60*24);
    if (diff > 366) rangeError = t('stats.dateRangeTooLong');
    if (diff < 0) rangeError = t('stats.invalidDateRange');
  }

  let posts: any[] = [];
  let schedules: any[] = [];
  let reserved = 0, uploadPending = 0, settlementPending = 0, scheduleDone = 0;
  let involvedInfluencers = 0;
  let plannedTotal = 0;

  if (!rangeError) {
    let q = sb.from('posts')
      .select('client_id, influencer_id, post_url, views, likes, comments, shares, created_at, settlement_status, settlement_count, influencers(unit_price)');
    if (client) q = q.eq('client_id', Number(client));
    if (influencer) q = q.eq('influencer_id', Number(influencer));
    if (fromDate) q = q.gte('created_at', `${fromDate}T00:00:00+09:00`);
    if (toDate) q = q.lte('created_at', `${toDate}T23:59:59+09:00`);
    const { data } = await q; posts = data ?? [];

    let sq = sb.from('schedules')
      .select('*, influencers(unit_price), posts(post_url, settlement_status, settlement_count)');
    if (client) sq = sq.eq('client_id', Number(client));
    if (influencer) sq = sq.eq('influencer_id', Number(influencer));
    if (fromDate) sq = sq.gte('scheduled_at', `${fromDate}T00:00:00+09:00`);
    if (toDate) sq = sq.lte('scheduled_at', `${toDate}T23:59:59+09:00`);
    const { data: schedulesData } = await sq;
    schedules = schedulesData ?? [];
    
    for (const s of schedules) {
      const st = getScheduleStatus(s.scheduled_at, s.posts);
      if (st === 'reserved') reserved++;
      else if (st === 'upload_pending') uploadPending++;
      else if (st === 'settlement_pending') settlementPending++;
      else if (st === 'done') scheduleDone++;

      if (st === 'reserved' || st === 'upload_pending') {
        const post = Array.isArray(s.posts) ? s.posts[0] : s.posts;
        const settlementCount = Math.max(1, post?.settlement_count ?? 1);
        plannedTotal += (s.influencers?.unit_price ?? 0) * settlementCount * 10;
      }
    }
    const involvedSet = new Set<number>();
    for (const s of schedules) {
      if (s.influencer_id) involvedSet.add(s.influencer_id);
    }
    involvedInfluencers = involvedSet.size;
  }

  const now = new Date();
  const isLastDay = now.getDate() === new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

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
    if (prev === 0) return cur > 0 ? t('stats.newDelta') : '-';
    const diff = cur - prev;
    const pct = ((diff / prev) * 100).toFixed(1);
    return `${diff >= 0 ? '+' : ''}${diff.toLocaleString()} (${pct}%)`;
  }

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
  const totalShares = posts.reduce((a, p) => a + (p.shares ?? 0), 0);
  const paidTotal = posts
    .filter((p: any) => p.settlement_status === 'done')
    .reduce((a, p: any) => a + ((p.influencers?.unit_price ?? 0) * Math.max(1, p.settlement_count ?? 1)), 0) * 10;
  const unpaidTotal = posts
    .filter((p: any) => p.post_url && p.settlement_status !== 'done')
    .reduce((a, p: any) => a + ((p.influencers?.unit_price ?? 0) * Math.max(1, p.settlement_count ?? 1)), 0) * 10;
  const grandTotal = paidTotal + unpaidTotal + plannedTotal;

  const metrics: { label: string; value: number; href?: string; suffix?: string }[] = [
    { label: t('stats.totalClients'), value: totalClients },
    { label: t('stats.totalInfluencers'), value: totalInfluencers },
    { label: t('stats.involvedInfluencers'), value: involvedInfluencers },
    { label: t('stats.uploadedPosts'), value: uploaded },
    { label: t('common.likes'), value: totalLikes },
    { label: t('common.comments'), value: totalComments },
    { label: t('common.views'), value: totalViews },
    { label: t('stats.totalPaid'), value: paidTotal, suffix: t('money.won'), href: '/influencers/posts' },
    { label: t('stats.totalUnpaid'), value: unpaidTotal, suffix: t('money.won'), href: '/influencers/posts' },
    { label: t('stats.plannedSpend'), value: plannedTotal, suffix: t('money.won'), href: '/campaigns/schedules' },
    { label: t('stats.totalSpend'), value: grandTotal, suffix: t('money.won'), href: '/influencers/posts' },
    { label: t('schedule.reserved'), value: reserved, href: '/campaigns/schedules' },
    { label: t('schedule.upload_pending'), value: uploadPending, href: '/campaigns/schedules' },
    { label: t('schedule.settlement_pending'), value: settlementPending, href: '/influencers/posts' },
    { label: t('schedule.done'), value: scheduleDone, href: '/campaigns/completed' },
    { label: t('stats.monthViews', { month: thisMonth }), value: tv },
    { label: t('stats.monthLikes', { month: thisMonth }), value: tl },
    { label: t('stats.monthComments', { month: thisMonth }), value: tc },
    { label: t('stats.monthShares', { month: thisMonth }), value: ts },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold">{t('stats.title')}</h1>

      <form className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm block mb-1 font-medium">{t('common.company')}</label>
          <select name="client" defaultValue={client ?? ''} className="border border-gray-400 rounded p-2 text-sm">
            <option value="">{t('common.all')}</option>
            {clients?.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">{t('common.influencer')}</label>
          <select name="influencer" defaultValue={influencer ?? ''} className="border border-gray-400 rounded p-2 text-sm">
            <option value="">{t('common.all')}</option>
            {influencers?.map((i) => <option key={i.id} value={i.id}>@{i.handle}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">{t('common.startDate')}</label>
          <input type="date" name="from" defaultValue={fromDate ?? ''} className="border border-gray-400 rounded p-2 text-sm" />
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">{t('common.endDate')}</label>
          <input type="date" name="to" defaultValue={toDate ?? ''} className="border border-gray-400 rounded p-2 text-sm" />
        </div>
        <button className="bg-black text-white px-4 py-2 rounded text-sm">{t('common.search')}</button>
      </form>

      {rangeError && <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded text-sm">{rangeError}</div>}

      <Group title={t('stats.basic')}>
        <MetricCard label={t('stats.totalClients')} value={totalClients} href="/campaigns/clients" />
        <MetricCard label={t('stats.totalInfluencers')} value={totalInfluencers} href="/influencers" />
        <MetricCard label={t('stats.involvedInfluencers')} value={involvedInfluencers} href="/campaigns/schedules" />
        <MetricCard label={t('schedule.reserved')} value={reserved} href="/campaigns/schedules" />
      </Group>
      
      <HideOnPresentation>
      <CollapsibleGroup title={t('stats.expense')} defaultOpen={false}>
        <MetricCard label={t('stats.totalPaid')} value={paidTotal} suffix={t('money.won')} href="/influencers/posts" />
        <MetricCard label={t('stats.totalUnpaid')} value={unpaidTotal} suffix={t('money.won')} href="/influencers/posts" />
        <MetricCard label={t('stats.plannedSpend')} value={plannedTotal} suffix={t('money.won')} href="/campaigns/schedules" />
        <MetricCard label={t('stats.totalSpend')} value={grandTotal} suffix={t('money.won')} href="/influencers/posts" />
      </CollapsibleGroup>
      </HideOnPresentation>
      
      <Group title={t('stats.status')}>
        <MetricCard label={t('stats.uploadedPosts')} value={uploaded} href="/campaigns/completed" />
        <MetricCard label={t('schedule.upload_pending')} value={uploadPending} href="/influencers/posts" />
        <MetricCard label={t('schedule.settlement_pending')} value={settlementPending} href="/influencers/posts" />
        <MetricCard label={t('schedule.done')} value={scheduleDone} href="/campaigns/completed" />
      </Group>
      
      <Group title={t('stats.performance')}>
        <MetricCard label={t('common.likes')} value={totalLikes} />
        <MetricCard label={t('common.comments')} value={totalComments} />
        <MetricCard label={t('common.views')} value={totalViews} />
        <MetricCard label={t('common.shares')} value={totalShares} />
      </Group>
      
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-lg font-semibold mb-4">{t('stats.compareToPrev', { thisMonth, prevMonth })}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DeltaCard label={t('common.views')} cur={tv} prev={pv} newLabel={t('stats.newDelta')} />
          <DeltaCard label={t('common.likes')} cur={tl} prev={pl} newLabel={t('stats.newDelta')} />
          <DeltaCard label={t('common.comments')} cur={tc} prev={pc} newLabel={t('stats.newDelta')} />
          <DeltaCard label={t('common.shares')} cur={ts} prev={ps} newLabel={t('stats.newDelta')} />
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

function MetricCard({ label, value, href, suffix }: {
  label: string; value: number; href?: string; suffix?: string;
}) {
  const inner = (
    <>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl md:text-3xl font-bold mt-1">
        {value.toLocaleString()}{suffix ?? ''}
      </div>
    </>
  );
  return href ? (
    <Link href={href} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition block">
      {inner}
    </Link>
  ) : (
    <div className="bg-gray-50 rounded-lg p-4">{inner}</div>
  );
}

function DeltaCard({ label, cur, prev, newLabel }: { label: string; cur: number; prev: number; newLabel: string }) {
  const diff = cur - prev;
  const pct = prev === 0 ? null : ((diff / prev) * 100).toFixed(1);
  const deltaStr = prev === 0
    ? (cur > 0 ? newLabel : '-')
    : `${diff >= 0 ? '+' : ''}${diff.toLocaleString()} (${pct}%)`;
  return (
    <div>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-bold">{cur.toLocaleString()}</div>
      <div className={`text-xs ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>{deltaStr}</div>
    </div>
  );
}
