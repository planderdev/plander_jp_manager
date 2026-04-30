import Link from 'next/link';
import CopyLinkButton from '@/components/report/CopyLinkButton';
import MonthlySettlementDeleteButton from '@/components/report/MonthlySettlementDeleteButton';
import MonthlySettlementCreateForm from '@/components/report/MonthlySettlementCreateForm';
import MonthlySettlementReportView from '@/components/report/MonthlySettlementReportView';
import { createAdminClient } from '@/lib/supabase/admin';
import { getI18n } from '@/lib/i18n/server';
import { createMonthlySettlementReportAction } from '@/actions/monthly-settlement-reports';
import { displayMonth } from '@/lib/report-links';
import { getMonthlySettlementReportData } from '@/lib/monthly-settlement-report';

type SearchParams = Promise<{ client?: string | string[]; month?: string }>;

function selectedClientIds(value: string | string[] | undefined, fallbackId?: number) {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const ids = raw.map(Number).filter(Boolean);
  if (ids.length) return Array.from(new Set(ids));
  return fallbackId ? [fallbackId] : [];
}

export default async function MonthlySettlementPage({ searchParams }: { searchParams: SearchParams }) {
  const { client, month } = await searchParams;
  const { locale, t } = await getI18n();
  const localeCode = locale === 'ja' ? 'ja-JP' : 'ko-KR';
  const sb = createAdminClient();

  const { data: clients } = await sb
    .from('clients')
    .select('id, company_name')
    .in('status', ['active', 'paused', 'ended'])
    .order('company_name');

  const selectedIds = selectedClientIds(client, clients?.[0]?.id);
  const selectedMonth = month || new Date().toISOString().slice(0, 7);
  const previewData = selectedIds.length
    ? await getMonthlySettlementReportData({ clientIds: selectedIds, yearMonth: selectedMonth })
    : null;

  const { data: reports } = selectedIds.length
    ? await sb
        .from('monthly_settlement_reports')
        .select('id, client_ids, year_month, title, share_token, created_at')
        .contains('client_ids', selectedIds)
        .order('created_at', { ascending: false })
    : { data: [] as Array<{ id: number; client_ids: number[]; year_month: string; title: string; share_token: string; created_at: string }> };

  const selectedClientLabel = (clients ?? [])
    .filter((item) => selectedIds.includes(item.id))
    .map((item) => item.company_name)
    .join(' / ');

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t('monthlySettlement.menuTitle')}</h1>
        <p className="text-sm text-gray-500">{t('monthlySettlement.help')}</p>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow">
        <form className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('monthlySettlement.campaigns')}</label>
            <div className="grid max-h-52 gap-2 overflow-y-auto rounded-xl border border-gray-300 bg-white p-3 md:grid-cols-2">
              {clients?.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="client"
                    value={item.id}
                    defaultChecked={selectedIds.includes(item.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>{item.company_name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('reports.month')}</label>
            <input type="month" name="month" defaultValue={selectedMonth} className="w-full rounded-xl border border-gray-300 p-3" />
          </div>
          <button className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white">
            {t('common.search')}
          </button>
        </form>

        <div className="mt-5 rounded-3xl border border-gray-200 bg-[#fafaf8] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{t('reports.new')}</p>
          <div className="mt-3">
            <MonthlySettlementCreateForm
              selectedIds={selectedIds}
              selectedMonth={selectedMonth}
              title={`${displayMonth(selectedMonth, localeCode)} ${t('monthlySettlement.reportSuffix')}`}
              selectedClientLabel={selectedClientLabel}
              action={createMonthlySettlementReportAction}
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold">{t('reports.generatedLinks')}</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {reports?.map((report) => (
            <div key={report.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <Link href={`/settlement-report/${report.share_token}`} target="_blank" className="text-base font-semibold text-gray-900 hover:underline">
                  {report.title}
                </Link>
                <p className="mt-1 text-sm text-gray-500">
                  {report.year_month}
                  {' · '}
                  {(clients ?? [])
                    .filter((item) => report.client_ids?.includes(item.id))
                    .map((item) => item.company_name)
                    .join(' / ') || '-'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <CopyLinkButton token={report.share_token} basePath="/settlement-report" />
                <Link href={`/settlement-report/${report.share_token}`} target="_blank" className="text-emerald-700 hover:underline">
                  {t('common.link')}
                </Link>
                <MonthlySettlementDeleteButton id={report.id} clientIds={selectedIds} yearMonth={selectedMonth} />
              </div>
            </div>
          ))}

          {!reports?.length && (
            <div className="px-6 py-10 text-center text-sm text-gray-400">
              {t('reports.none')}
            </div>
          )}
        </div>
      </section>

      {previewData ? (
        <section className="space-y-3">
          <div className="space-y-1 px-1">
            <h2 className="text-lg font-semibold">{t('monthlySettlement.previewTitle')}</h2>
            <p className="text-sm text-gray-500">{t('monthlySettlement.previewHelp')}</p>
          </div>
          <MonthlySettlementReportView data={previewData} />
        </section>
      ) : null}
    </div>
  );
}
