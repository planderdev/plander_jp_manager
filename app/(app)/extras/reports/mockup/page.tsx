import Link from 'next/link';
import Logo from '@/components/Logo';
import ChannelIcon from '@/components/ChannelIcon';
import { createClient } from '@/lib/supabase/server';
import { getI18n } from '@/lib/i18n/server';
import { channelLabel } from '@/lib/labels';

type SearchParams = Promise<{ client?: string; month?: string }>;

type Row = {
  id: number | string;
  visitDate: string;
  handle: string;
  accountUrl: string | null;
  followers: number;
  postUrl: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  grade: 'A' | 'B' | 'C';
  channel: string;
};

type PostRecord = {
  id: number;
  post_url: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  uploaded_on: string | null;
  created_at: string | null;
  influencers: {
    handle: string | null;
    followers: number | null;
    account_url: string | null;
    channel: string | null;
  } | null;
  schedules: {
    scheduled_at: string | null;
  } | null;
};

function previousMonth(month: string) {
  const [year, monthValue] = month.split('-').map(Number);
  const prev = new Date(Date.UTC(year, monthValue - 2, 1));
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`;
}

function displayMonth(month: string, locale: string) {
  const [year, monthValue] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    timeZone: 'Asia/Seoul',
  }).format(new Date(Date.UTC(year, monthValue - 1, 1)));
}

function resolveVisitDate(row: {
  uploaded_on?: string | null;
  schedules?: { scheduled_at?: string | null } | null;
  created_at?: string | null;
}) {
  return row.uploaded_on || row.schedules?.scheduled_at || row.created_at || null;
}

function isWithinMonth(value: string | null, month: string) {
  if (!value) return false;
  return value.slice(0, 7) === month;
}

function gradeForRow(views: number, likes: number, comments: number, shares: number): 'A' | 'B' | 'C' {
  const engagement = likes + comments + shares;
  if (views >= 10000 || engagement >= 300) return 'A';
  if (views >= 3000 || engagement >= 120) return 'B';
  return 'C';
}

function sumRows(rows: Row[]) {
  return rows.reduce(
    (acc, row) => ({
      views: acc.views + row.views,
      likes: acc.likes + row.likes,
      comments: acc.comments + row.comments,
      shares: acc.shares + row.shares,
      followers: acc.followers + row.followers,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, followers: 0 }
  );
}

function diffClass(diff: number) {
  if (diff < 0) return 'text-red-500';
  if (diff > 0) return 'text-blue-600';
  return 'text-gray-500';
}

function diffText(diff: number) {
  return `${diff > 0 ? '+' : ''}${diff.toLocaleString()}`;
}

export default async function ReportMockupPage({ searchParams }: { searchParams: SearchParams }) {
  const { client, month } = await searchParams;
  const { locale, t } = await getI18n();
  const sb = await createClient();

  const currentMonth = month || new Date().toISOString().slice(0, 7);
  const prevMonth = previousMonth(currentMonth);

  const { data: clients } = await sb.from('clients').select('id, company_name, contract_start, contract_end, contract_product, manager_name, sales_region, category').order('company_name');
  const selectedClientId = client ? Number(client) : clients?.[0]?.id;
  const selectedClient = clients?.find((item) => item.id === selectedClientId) ?? clients?.[0] ?? null;

  const { data: postData } = selectedClientId
    ? await sb.from('posts').select(`
        id,
        client_id,
        influencer_id,
        post_url,
        views,
        likes,
        comments,
        shares,
        uploaded_on,
        created_at,
        influencers (
          handle,
          followers,
          account_url,
          channel
        ),
        schedules (
          scheduled_at
        )
      `).eq('client_id', selectedClientId).order('created_at', { ascending: false })
    : { data: [] as PostRecord[] };

  const allPosts = (postData ?? []) as PostRecord[];
  const currentRows = allPosts
    .filter((row) => isWithinMonth(resolveVisitDate(row), currentMonth))
    .map((row) => ({
      id: row.id,
      visitDate: resolveVisitDate(row)?.slice(0, 10) ?? currentMonth,
      handle: row.influencers?.handle ?? 'sample_creator',
      accountUrl: row.influencers?.account_url ?? null,
      followers: row.influencers?.followers ?? 0,
      postUrl: row.post_url ?? null,
      views: row.views ?? 0,
      likes: row.likes ?? 0,
      comments: row.comments ?? 0,
      shares: row.shares ?? 0,
      grade: gradeForRow(row.views ?? 0, row.likes ?? 0, row.comments ?? 0, row.shares ?? 0),
      channel: row.influencers?.channel ?? 'instagram',
    })) as Row[];

  const prevRows = allPosts
    .filter((row) => isWithinMonth(resolveVisitDate(row), prevMonth))
    .map((row) => ({
      id: row.id,
      visitDate: resolveVisitDate(row)?.slice(0, 10) ?? prevMonth,
      handle: row.influencers?.handle ?? 'sample_creator',
      accountUrl: row.influencers?.account_url ?? null,
      followers: row.influencers?.followers ?? 0,
      postUrl: row.post_url ?? null,
      views: row.views ?? 0,
      likes: row.likes ?? 0,
      comments: row.comments ?? 0,
      shares: row.shares ?? 0,
      grade: gradeForRow(row.views ?? 0, row.likes ?? 0, row.comments ?? 0, row.shares ?? 0),
      channel: row.influencers?.channel ?? 'instagram',
    })) as Row[];

  let rows = currentRows;
  let usingFallback = false;

  if (!rows.length) {
    usingFallback = true;
    const { data: influencers } = await sb.from('influencers').select('id, handle, followers, account_url, channel').order('created_at', { ascending: false }).limit(3);
    const seeds = [
      { views: 18420, likes: 640, comments: 41, shares: 17 },
      { views: 9230, likes: 381, comments: 26, shares: 8 },
      { views: 5170, likes: 219, comments: 19, shares: 5 },
    ];
    rows = (influencers ?? []).map((item, index) => ({
      id: item.id,
      visitDate: `${currentMonth}-${String(index + 8).padStart(2, '0')}`,
      handle: item.handle,
      accountUrl: item.account_url,
      followers: item.followers ?? 0,
      postUrl: item.account_url,
      ...seeds[index % seeds.length],
      grade: gradeForRow(seeds[index % seeds.length].views, seeds[index % seeds.length].likes, seeds[index % seeds.length].comments, seeds[index % seeds.length].shares),
      channel: item.channel ?? 'instagram',
    }));
  }

  const currentTotals = sumRows(rows);
  const prevTotals = sumRows(prevRows);
  const channelMap = new Map<string, Row[]>();
  rows.forEach((row) => {
    const bucket = channelMap.get(row.channel) ?? [];
    bucket.push(row);
    channelMap.set(row.channel, bucket);
  });
  if (!channelMap.size) channelMap.set('instagram', rows);

  const localeCode = locale === 'ja' ? 'ja-JP' : 'ko-KR';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f2ea_0%,#ffffff_40%,#f6f7fb_100%)] text-gray-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 md:px-8 md:py-8">
        <div className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <span className="inline-flex rounded-full bg-black px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-white">
                {t('reportMockup.previewBadge')}
              </span>
              <div className="flex items-center gap-3">
                <Logo className="h-5 w-auto text-black" />
                <div className="h-5 w-px bg-gray-300" />
                <p className="text-sm text-gray-500">{t('reportMockup.pageDescription')}</p>
              </div>
              <div>
                <h1 className="text-2xl font-bold md:text-4xl">{selectedClient?.company_name ?? 'Plander'}</h1>
                <p className="mt-2 text-sm text-gray-600 md:text-base">
                  {displayMonth(currentMonth, localeCode)} · {t('reportMockup.pageTitle')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/extras/reports" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                {t('common.back')}
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-3xl bg-[#f5f6fa] px-4 py-4 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{selectedClient?.company_name ?? 'Plander'}</span>
            {' · '}
            <span>{displayMonth(currentMonth, localeCode)}</span>
          </div>
        </div>

        {usingFallback && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t('reportMockup.noData')}
          </div>
        )}

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">{t('reportMockup.campaignInfo')}</p>
              <h2 className="mt-2 text-xl font-bold md:text-2xl">{t('reportMockup.campaignInfo')}</h2>
            </div>
            <p className="max-w-xs text-right text-sm text-gray-500">{t('reportMockup.mobileNote')}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label={t('reportMockup.selectedClient')} value={selectedClient?.company_name ?? '-'} />
            <InfoCard
              label={t('reportMockup.reportMonth')}
              value={displayMonth(currentMonth, localeCode)}
            />
            <InfoCard
              label={t('reportMockup.campaignPeriod')}
              value={[selectedClient?.contract_start, selectedClient?.contract_end].filter(Boolean).join(' ~ ') || '-'}
            />
            <InfoCard label={t('reportMockup.contractProduct')} value={selectedClient?.contract_product ?? '-'} />
            <InfoCard label={t('reportMockup.region')} value={[selectedClient?.sales_region, selectedClient?.category].filter(Boolean).join(' / ') || '-'} />
            <InfoCard label={t('reportMockup.manager')} value={selectedClient?.manager_name ?? '-'} />
            <InfoCard label={t('reportMockup.totalCreators')} value={`${rows.length.toLocaleString()}${t('common.people')}`} />
            <InfoCard label={t('reportMockup.totalPosts')} value={rows.length.toLocaleString()} />
          </div>
        </section>

        <section className="rounded-[28px] bg-[#10131a] px-5 py-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] md:px-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">{t('reportMockup.resultAnalysis')}</p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">{t('reportMockup.integratedReport')}</h2>
              <p className="mt-2 text-sm text-white/70">{displayMonth(currentMonth, localeCode)} · {selectedClient?.company_name ?? 'Plander'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MiniStat label={t('reportMockup.totalViews')} value={currentTotals.views} />
              <MiniStat label={t('reportMockup.totalLikes')} value={currentTotals.likes} />
              <MiniStat label={t('reportMockup.totalComments')} value={currentTotals.comments} />
              <MiniStat label={t('reportMockup.totalShares')} value={currentTotals.shares} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {Array.from(channelMap.entries()).map(([channel, items]) => {
              const totals = sumRows(items);
              return (
                <div key={channel} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
                      <ChannelIcon channel={channel} size={20} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/50">{channelLabel(channel, locale)}</p>
                      <h3 className="text-lg font-semibold">{channelLabel(channel, locale)}</h3>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <DarkMetric label={t('reportMockup.totalPosts')} value={items.length} />
                    <DarkMetric label={t('reportMockup.totalCreators')} value={new Set(items.map((item) => item.handle)).size} />
                    <DarkMetric label={t('reportMockup.totalFollowers')} value={totals.followers} />
                    <DarkMetric label={t('reportMockup.totalViews')} value={totals.views} />
                    <DarkMetric label={t('reportMockup.totalLikes')} value={totals.likes} />
                    <DarkMetric label={t('reportMockup.totalComments')} value={totals.comments} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">{t('reportMockup.influencerReport')}</p>
              <h2 className="mt-2 text-xl font-bold md:text-2xl">{t('reportMockup.influencerReport')}</h2>
            </div>
            <p className="text-sm text-gray-500">{rows.length.toLocaleString()} records</p>
          </div>

          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <div key={row.id} className="rounded-[24px] border border-gray-200 bg-[#fafaf8] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-gray-400">{row.visitDate}</p>
                    <a href={row.accountUrl ?? '#'} target="_blank" className="mt-1 block text-lg font-semibold text-black underline-offset-4 hover:underline">
                      @{row.handle}
                    </a>
                    <p className="mt-1 text-sm text-gray-500">{row.followers.toLocaleString()} {t('common.people')}</p>
                  </div>
                  <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">{row.grade}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <MetricChip label={t('common.views')} value={row.views} />
                  <MetricChip label={t('common.likes')} value={row.likes} />
                  <MetricChip label={t('common.comments')} value={row.comments} />
                  <MetricChip label={t('reportMockup.reposts')} value={row.shares} />
                </div>
                <div className="mt-4">
                  <a href={row.postUrl ?? row.accountUrl ?? '#'} target="_blank" className="inline-flex rounded-full border border-gray-900 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-900 hover:text-white">
                    {t('reportMockup.postLink')}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[24px] border border-gray-200 md:block">
            <table className="w-full text-sm">
              <thead className="bg-[#f5f6fa] text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3">{t('reportMockup.visitDate')}</th>
                  <th className="px-4 py-3">{t('reportMockup.accountLink')}</th>
                  <th className="px-4 py-3">{t('influencer.followers')}</th>
                  <th className="px-4 py-3">{t('reportMockup.postLink')}</th>
                  <th className="px-4 py-3">{t('common.views')}</th>
                  <th className="px-4 py-3">{t('common.likes')}</th>
                  <th className="px-4 py-3">{t('common.comments')}</th>
                  <th className="px-4 py-3">{t('reportMockup.reposts')}</th>
                  <th className="px-4 py-3">{t('reportMockup.selfGrade')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{row.visitDate}</td>
                    <td className="px-4 py-3">
                      <a href={row.accountUrl ?? '#'} target="_blank" className="font-medium text-blue-700 hover:underline">
                        @{row.handle}
                      </a>
                    </td>
                    <td className="px-4 py-3">{row.followers.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <a href={row.postUrl ?? row.accountUrl ?? '#'} target="_blank" className="text-blue-700 hover:underline">
                        {t('common.link')}
                      </a>
                    </td>
                    <td className="px-4 py-3">{row.views.toLocaleString()}</td>
                    <td className="px-4 py-3">{row.likes.toLocaleString()}</td>
                    <td className="px-4 py-3">{row.comments.toLocaleString()}</td>
                    <td className="px-4 py-3">{row.shares.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">{row.grade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">{t('reportMockup.totalSummary')}</p>
              <h2 className="mt-2 text-xl font-bold md:text-2xl">{t('reportMockup.totalSummary')}</h2>
            </div>
            <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#3b4cca]">
              {displayMonth(currentMonth, localeCode)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryCard
              label={t('common.views')}
              value={currentTotals.views}
              diff={currentTotals.views - prevTotals.views}
            />
            <SummaryCard
              label={t('common.likes')}
              value={currentTotals.likes}
              diff={currentTotals.likes - prevTotals.likes}
            />
            <SummaryCard
              label={t('common.comments')}
              value={currentTotals.comments}
              diff={currentTotals.comments - prevTotals.comments}
            />
            <SummaryCard
              label={t('reportMockup.reposts')}
              value={currentTotals.shares}
              diff={currentTotals.shares - prevTotals.shares}
            />
          </div>
        </section>

        <footer className="pb-8 pt-2 text-center text-xs text-gray-500">
          Copyright © 2022 - {new Date().getFullYear()} Plander Co., Ltd. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-gray-200 bg-[#fafaf8] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">{label}</p>
      <p className="mt-3 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}

function DarkMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value.toLocaleString()}</p>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}

function SummaryCard({ label, value, diff }: { label: string; value: number; diff: number }) {
  return (
    <div className="rounded-[24px] border border-gray-200 bg-[#fafaf8] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">{label}</p>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className={`mt-2 text-sm font-semibold ${diffClass(diff)}`}>
        {diffText(diff)}
      </p>
    </div>
  );
}
