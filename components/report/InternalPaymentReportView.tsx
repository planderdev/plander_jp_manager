import Logo from '@/components/Logo';
import ChannelIcon from '@/components/ChannelIcon';
import { channelLabel } from '@/lib/labels';
import type { InternalPaymentReportData, PaymentStatus } from '@/lib/internal-payment-report';

function money(value: number) {
  return `${value.toLocaleString()}원`;
}

function statusClass(status: PaymentStatus) {
  switch (status) {
    case 'settled':
      return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
    case 'settlement_pending':
      return 'bg-red-100 text-red-700 ring-1 ring-red-200';
    default:
      return 'bg-gray-100 text-gray-600 ring-1 ring-gray-200';
  }
}

function statusLabel(status: PaymentStatus, t: (key: string) => string) {
  switch (status) {
    case 'settled':
      return t('paymentReport.statusSettled');
    case 'settlement_pending':
      return t('paymentReport.statusPayable');
    default:
      return t('paymentReport.statusUploadPending');
  }
}

export default function InternalPaymentReportView({
  locale,
  t,
  data,
}: {
  locale: 'ko' | 'ja';
  t: (key: string, vars?: Record<string, string | number>) => string;
  data: InternalPaymentReportData;
}) {
  return (
    <div className="rounded-[32px] bg-[linear-gradient(180deg,#f5f2ea_0%,#ffffff_42%,#f6f7fb_100%)] p-3 text-gray-900 md:p-6">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
        <div className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-black px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-white">
              INTERNAL PAYMENT REPORT
            </span>
            <div className="flex items-center gap-3">
              <Logo className="h-5 w-auto text-black" />
              <div className="h-5 w-px bg-gray-300" />
              <p className="text-sm text-gray-500">{t('paymentReport.description')}</p>
            </div>
            <div>
              <h1 className="text-2xl font-bold md:text-4xl">{t('paymentReport.title')}</h1>
              <p className="mt-2 text-sm text-gray-600 md:text-base">
                {data.periodLabel}
              </p>
            </div>
          </div>
        </div>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">{t('reportMockup.totalSummary')}</p>
              <h2 className="mt-2 text-xl font-bold md:text-2xl">{t('reportMockup.totalSummary')}</h2>
            </div>
            <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#3b4cca]">
              {data.periodLabel}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <SummaryCard label={t('common.views')} value={data.currentTotals.views} />
            <SummaryCard label={t('common.likes')} value={data.currentTotals.likes} />
            <SummaryCard label={t('common.comments')} value={data.currentTotals.comments} />
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">{t('paymentReport.monthlyProgress')}</p>
            <h2 className="mt-2 text-xl font-bold md:text-2xl">{t('paymentReport.monthlyProgress')}</h2>
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
            {!data.clientMonthlyCounts.length && (
              <div className="rounded-[22px] border border-gray-200 bg-[#fafaf8] p-6 text-center text-sm text-gray-400">
                {t('reports.none')}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">{t('stats.expense')}</p>
            <h2 className="mt-2 text-xl font-bold md:text-2xl">{t('paymentReport.expenseSummary')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <ExpenseCard label={t('stats.totalPaid')} value={data.expenses.paidTotal} tone="green" />
            <ExpenseCard label={t('stats.totalUnpaid')} value={data.expenses.payableTotal} tone="red" />
            <ExpenseCard label={t('stats.plannedSpend')} value={data.expenses.pendingTotal} tone="gray" />
            <ExpenseCard label={t('stats.totalSpend')} value={data.expenses.grandTotal} tone="black" />
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">{t('nav.monthlySettlement')}</p>
              <h2 className="mt-2 text-xl font-bold md:text-2xl">{t('paymentReport.monthlySettlementSummary')}</h2>
            </div>
            {data.monthlySettlementSummary ? (
              <p className="text-sm text-gray-500">
                {t('paymentReport.linkedSettlementCount', {
                  count: data.monthlySettlementSummary.reports.length,
                })}
              </p>
            ) : null}
          </div>

          {data.monthlySettlementSummary ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <ExpenseCard label={t('paymentReport.totalIncoming')} value={data.monthlySettlementSummary.incomingTotal} tone="green" />
                <ExpenseCard label={t('paymentReport.totalOutgoing')} value={data.monthlySettlementSummary.outgoingTotal} tone="red" />
                <ExpenseCard label={t('paymentReport.netBalance')} value={data.monthlySettlementSummary.netTotal} tone={data.monthlySettlementSummary.netTotal >= 0 ? 'black' : 'red'} />
              </div>

              <div className="rounded-[24px] border border-gray-200 bg-[#fafaf8] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">{t('paymentReport.linkedSettlementReports')}</p>
                <div className="mt-3 space-y-3">
                  {data.monthlySettlementSummary.reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{report.title}</p>
                        <p className="mt-1 text-xs text-gray-500">{report.yearMonth}</p>
                      </div>
                      <a
                        href={`/settlement-report/${report.shareToken}`}
                        target="_blank"
                        className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        {t('paymentReport.openSettlementReport')}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-gray-300 bg-[#fafaf8] p-8 text-center text-sm text-gray-400">
              {t('paymentReport.noMonthlySettlement')}
            </div>
          )}
        </section>

        <section className="rounded-[28px] bg-[#10131a] px-5 py-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] md:px-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">{t('reportMockup.resultAnalysis')}</p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">{t('reportMockup.platformReport')}</h2>
              <p className="mt-2 text-sm text-white/70">{data.periodLabel}</p>
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
                  posts: acc.posts + (item.postUrl ? 1 : 0),
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
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">{t('reportMockup.influencerReport')}</p>
              <h2 className="mt-2 text-xl font-bold md:text-2xl">{t('reportMockup.influencerReport')}</h2>
            </div>
            <p className="text-sm text-gray-500">{data.rows.length.toLocaleString()} records</p>
          </div>

          <div className="space-y-3 md:hidden">
            {data.rows.map((row) => (
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
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(row.paymentStatus)}`}>
                    {statusLabel(row.paymentStatus, t)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <MetricChip label={t('common.views')} value={row.views} />
                  <MetricChip label={t('common.likes')} value={row.likes} />
                  <MetricChip label={t('common.comments')} value={row.comments} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {row.postUrl ? (
                    <a href={row.postUrl} target="_blank" className="inline-flex rounded-full border border-gray-900 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-900 hover:text-white">
                      {t('reportMockup.postLink')}
                    </a>
                  ) : (
                    <span className="inline-flex rounded-full border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-500">
                      {t('reportMockup.uploadPending')}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-gray-800">{money(row.payoutKrw)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[24px] border border-gray-200 md:block">
            <table className="w-full text-sm">
              <thead className="bg-[#f5f6fa] text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3">{t('reportMockup.visitDate')}</th>
                  <th className="px-4 py-3">{t('reportMockup.storeName')}</th>
                  <th className="px-4 py-3">{t('reportMockup.accountLink')}</th>
                  <th className="px-4 py-3">{t('influencer.followers')}</th>
                  <th className="px-4 py-3">{t('reportMockup.postLink')}</th>
                  <th className="px-4 py-3">{t('common.views')}</th>
                  <th className="px-4 py-3">{t('common.likes')}</th>
                  <th className="px-4 py-3">{t('common.comments')}</th>
                  <th className="px-4 py-3">{t('postForm.settlementAmount')}</th>
                  <th className="px-4 py-3">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
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
                    <td className="px-4 py-3">{money(row.payoutKrw)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(row.paymentStatus)}`}>
                        {statusLabel(row.paymentStatus, t)}
                      </span>
                    </td>
                  </tr>
                ))}
                {!data.rows.length && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-400">{t('reports.none')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-gray-200 bg-[#fafaf8] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">{label}</p>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}

function ExpenseCard({ label, value, tone }: { label: string; value: number; tone: 'green' | 'red' | 'gray' | 'black' }) {
  const toneClass = {
    green: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    red: 'bg-red-50 text-red-800 border-red-100',
    gray: 'bg-gray-50 text-gray-800 border-gray-200',
    black: 'bg-gray-950 text-white border-gray-950',
  }[tone];

  return (
    <div className={`rounded-[24px] border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-3 text-2xl font-bold">{money(value)}</p>
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
