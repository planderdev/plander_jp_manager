import Logo from '@/components/Logo';
import ChannelIcon from '@/components/ChannelIcon';
import SortableHeaderLink from '@/components/table/SortableHeaderLink';
import { channelLabel } from '@/lib/labels';
import { sortItems, type SortOrder } from '@/lib/table-sort';
import { displayMonth, type ReportViewData } from '@/lib/report-links';

type SearchParamsValue = string | string[] | undefined;

function diffClass(diff: number) {
  if (diff < 0) return 'text-red-500';
  if (diff > 0) return 'text-blue-600';
  return 'text-gray-500';
}

function diffText(diff: number) {
  return `${diff > 0 ? '+' : ''}${diff.toLocaleString()}`;
}

function gradeClass(grade: ReportViewData['rows'][number]['grade']) {
  switch (grade) {
    case 'S':
      return 'bg-amber-400 text-amber-950 ring-1 ring-amber-300';
    case 'A':
      return 'bg-orange-500 text-white';
    case 'B':
      return 'bg-blue-600 text-white';
    case 'C':
      return 'bg-emerald-600 text-white';
    case 'F':
      return 'bg-red-600 text-white';
    default:
      return 'bg-gray-200 text-gray-600';
  }
}

export default function SharedReportView({
  locale,
  t,
  data,
  generatedAt,
  currentSort,
  currentOrder,
  searchParams,
}: {
  locale: 'ko' | 'ja';
  t: (key: string, vars?: Record<string, string | number>) => string;
  data: ReportViewData;
  generatedAt: string | null;
  currentSort?: string;
  currentOrder?: SortOrder;
  searchParams?: Record<string, SearchParamsValue>;
}) {
  const localeCode = locale === 'ja' ? 'ja-JP' : 'ko-KR';
  const monthLabel = displayMonth(data.yearMonth, localeCode);
  const generatedAtLabel = generatedAt ? formatGeneratedDate(generatedAt, locale) : null;
  const sortKey = currentSort ?? 'visitDate';
  const sortOrder = currentOrder ?? 'desc';
  const sortedRows = sortItems(data.rows, (row) => {
    switch (sortKey) {
      case 'storeName':
        return row.storeName;
      case 'handle':
        return row.handle;
      case 'followers':
        return row.followers;
      case 'postUrl':
        return row.postUrl ?? '';
      case 'views':
        return row.views;
      case 'likes':
        return row.likes;
      case 'comments':
        return row.comments;
      case 'grade':
        return row.grade;
      default:
        return row.visitDate;
    }
  }, sortOrder);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f2ea_0%,#ffffff_40%,#f6f7fb_100%)] text-gray-900">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-5 md:px-8 md:py-8">
        <div className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
          <div className="space-y-3">
            {generatedAtLabel ? (
              <div className="flex justify-end">
                <p className="text-sm text-gray-500">{t('reportMockup.generatedAtBase', { date: generatedAtLabel })}</p>
              </div>
            ) : null}
            <span className="inline-flex rounded-full bg-black px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-white">
              {t('reportMockup.previewBadge')}
            </span>
            <div className="flex items-center gap-3">
              <Logo className="h-5 w-auto text-black" />
              <div className="h-5 w-px bg-gray-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold md:text-4xl">{data.client?.company_name ?? 'Plander'}</h1>
              <p className="mt-2 text-sm text-gray-600 md:text-base">
                {monthLabel} · {t('reportMockup.pageTitle')}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-3xl bg-[#f5f6fa] px-4 py-4 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{data.client?.company_name ?? 'Plander'}</span>
            {' · '}
            <span>{monthLabel}</span>
          </div>
        </div>

        {data.usingFallback && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t('reportMockup.noData')}
          </div>
        )}

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">CAMPAIGN INFO</p>
              <h2 className="mt-2 text-xl font-bold md:text-2xl">{t('reportMockup.campaignInfo')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label={t('reportMockup.selectedClient')} value={data.client?.company_name ?? '-'} />
            <InfoCard label={t('reportMockup.reportMonth')} value={monthLabel} />
            <InfoCard label={t('reportMockup.campaignPeriod')} value={[data.client?.contract_start, data.client?.contract_end].filter(Boolean).join(' ~ ') || '-'} />
            <InfoCard label={t('reportMockup.contractProduct')} value={data.client?.contract_product ?? '-'} />
            <InfoCard label={t('reportMockup.region')} value={[data.client?.sales_region, data.client?.category].filter(Boolean).join(' / ') || '-'} />
            <InfoCard label={t('reportMockup.manager')} value={data.client?.manager_name ?? '-'} />
            <InfoCard label={t('reportMockup.totalCreators')} value={`${sortedRows.length.toLocaleString()}${t('common.people')}`} />
            <InfoCard label={t('reportMockup.totalPosts')} value={sortedRows.length.toLocaleString()} />
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">TOTAL SUMMARY</p>
              <h2 className="mt-2 text-xl font-bold md:text-2xl">{t('reportMockup.totalSummary')}</h2>
            </div>
            <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#3b4cca]">
              {monthLabel}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <SummaryCard label={t('common.views')} value={data.currentTotals.views} diff={data.currentTotals.views - data.prevTotals.views} />
            <SummaryCard label={t('common.likes')} value={data.currentTotals.likes} diff={data.currentTotals.likes - data.prevTotals.likes} />
            <SummaryCard label={t('common.comments')} value={data.currentTotals.comments} diff={data.currentTotals.comments - data.prevTotals.comments} />
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">MONTHLY PROGRESS</p>
            <h2 className="mt-2 text-xl font-bold md:text-2xl">{t('reportMockup.monthlyProgress')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.clientMonthlyCounts.map((item) => (
              <div key={item.key} className="rounded-[22px] border border-gray-200 bg-[#fafaf8] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">{item.month}</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">{item.clientName}</p>
                  <p className="text-2xl font-bold text-gray-950">{item.count.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] bg-[#10131a] px-5 py-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] md:px-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">RESULT ANALYSIS</p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">{t('reportMockup.platformReport')}</h2>
              <p className="mt-2 text-sm text-white/70">{monthLabel} · {data.client?.company_name ?? 'Plander'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <MiniStat label={t('reportMockup.totalViews')} value={data.currentTotals.views} />
              <MiniStat label={t('reportMockup.totalLikes')} value={data.currentTotals.likes} />
              <MiniStat label={t('reportMockup.totalComments')} value={data.currentTotals.comments} />
            </div>
          </div>

          <div className={`mt-6 grid gap-4 ${data.channelEntries.length > 1 ? 'grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
            {data.channelEntries.map(([channel, items]) => {
              const totals = items.reduce(
                (acc, item) => ({
                  posts: acc.posts + 1,
                  creators: acc.creators.add(item.handle),
                  followers: acc.followers + item.followers,
                  views: acc.views + item.views,
                  likes: acc.likes + item.likes,
                  comments: acc.comments + item.comments,
                  shares: acc.shares + item.shares,
                }),
                {
                  posts: 0,
                  creators: new Set<string>(),
                  followers: 0,
                  views: 0,
                  likes: 0,
                  comments: 0,
                  shares: 0,
                }
              );

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
                  <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
                    <DarkMetric label={t('reportMockup.totalPosts')} value={totals.posts} />
                    <DarkMetric label={t('reportMockup.totalCreators')} value={totals.creators.size} />
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
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">INFLUENCER REPORT</p>
              <h2 className="mt-2 text-xl font-bold md:text-2xl">{t('reportMockup.influencerReport')}</h2>
            </div>
            <p className="text-sm text-gray-500">{sortedRows.length.toLocaleString()} records</p>
          </div>

          <div className="space-y-3 md:hidden">
            {sortedRows.map((row) => (
              <div key={row.id} className="rounded-[24px] border border-gray-200 bg-[#fafaf8] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-gray-400">{row.visitDate}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{row.storeName}</p>
                    <a href={row.accountUrl ?? '#'} target="_blank" className="mt-1 block text-lg font-semibold text-black underline-offset-4 hover:underline">
                      @{row.handle}
                    </a>
                    <p className="mt-1 text-sm text-gray-500">{row.followers.toLocaleString()} {t('common.people')}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${gradeClass(row.grade)}`}>
                    {row.grade === 'pending' ? t('grade.pending') : row.grade}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <MetricChip label={t('common.views')} value={row.views} />
                  <MetricChip label={t('common.likes')} value={row.likes} />
                  <MetricChip label={t('common.comments')} value={row.comments} />
                </div>
                <div className="mt-4">
                  {row.postUrl ? (
                    <a href={row.postUrl} target="_blank" className="inline-flex rounded-full border border-gray-900 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-900 hover:text-white">
                      {t('reportMockup.postLink')}
                    </a>
                  ) : (
                    <span className="inline-flex rounded-full border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-500">
                      {t('reportMockup.uploadPending')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[24px] border border-gray-200 md:block">
            <table className="w-full text-sm">
              <thead className="bg-[#f5f6fa] text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3"><SortableHeaderLink label={t('reportMockup.visitDate')} sortKey="visitDate" currentSort={sortKey} currentOrder={sortOrder} searchParams={searchParams} /></th>
                  <th className="px-4 py-3"><SortableHeaderLink label={t('reportMockup.storeName')} sortKey="storeName" currentSort={sortKey} currentOrder={sortOrder} searchParams={searchParams} /></th>
                  <th className="px-4 py-3"><SortableHeaderLink label={t('reportMockup.accountLink')} sortKey="handle" currentSort={sortKey} currentOrder={sortOrder} searchParams={searchParams} /></th>
                  <th className="px-4 py-3"><SortableHeaderLink label={t('influencer.followers')} sortKey="followers" currentSort={sortKey} currentOrder={sortOrder} searchParams={searchParams} /></th>
                  <th className="px-4 py-3"><SortableHeaderLink label={t('reportMockup.postLink')} sortKey="postUrl" currentSort={sortKey} currentOrder={sortOrder} searchParams={searchParams} /></th>
                  <th className="px-4 py-3"><SortableHeaderLink label={t('common.views')} sortKey="views" currentSort={sortKey} currentOrder={sortOrder} searchParams={searchParams} /></th>
                  <th className="px-4 py-3"><SortableHeaderLink label={t('common.likes')} sortKey="likes" currentSort={sortKey} currentOrder={sortOrder} searchParams={searchParams} /></th>
                  <th className="px-4 py-3"><SortableHeaderLink label={t('common.comments')} sortKey="comments" currentSort={sortKey} currentOrder={sortOrder} searchParams={searchParams} /></th>
                  <th className="px-4 py-3"><SortableHeaderLink label={t('reportMockup.selfGrade')} sortKey="grade" currentSort={sortKey} currentOrder={sortOrder} searchParams={searchParams} /></th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{row.visitDate}</td>
                    <td className="px-4 py-3">{row.storeName}</td>
                    <td className="px-4 py-3">
                      <a href={row.accountUrl ?? '#'} target="_blank" className="font-medium text-blue-700 hover:underline">
                        @{row.handle}
                      </a>
                    </td>
                    <td className="px-4 py-3">{row.followers.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {row.postUrl ? (
                        <a href={row.postUrl} target="_blank" className="text-blue-700 hover:underline">
                          {t('common.link')}
                        </a>
                      ) : (
                        <span className="text-gray-400">{t('reportMockup.uploadPending')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{row.views.toLocaleString()}</td>
                    <td className="px-4 py-3">{row.likes.toLocaleString()}</td>
                    <td className="px-4 py-3">{row.comments.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${gradeClass(row.grade)}`}>
                        {row.grade === 'pending' ? t('grade.pending') : row.grade}
                      </span>
                    </td>
                  </tr>
                ))}
                {!sortedRows.length && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400">{t('reports.none')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="pb-8 pt-2 text-center text-xs text-gray-500">
          Copyright © 2022 - {new Date().getFullYear()} Plander Co., Ltd. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

function formatGeneratedDate(value: string, locale: 'ko' | 'ja') {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(new Date(value))) {
    if (part.type !== 'literal') {
      parts[part.type] = part.value;
    }
  }

  if (locale === 'ja') {
    return `${parts.year}年${parts.month}月${parts.day}日`;
  }

  return `${parts.year}년 ${parts.month}월 ${parts.day}일`;
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
