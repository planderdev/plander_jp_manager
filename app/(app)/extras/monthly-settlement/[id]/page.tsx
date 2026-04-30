import { notFound } from 'next/navigation';
import MonthlySettlementCreateForm from '@/components/report/MonthlySettlementCreateForm';
import MonthlySettlementReportView from '@/components/report/MonthlySettlementReportView';
import { updateMonthlySettlementReportAction } from '@/actions/monthly-settlement-reports';
import { createAdminClient } from '@/lib/supabase/admin';
import { getI18n } from '@/lib/i18n/server';
import { getMonthlySettlementReportData } from '@/lib/monthly-settlement-report';
import { displayMonth } from '@/lib/report-links';

async function signedUploads(paths: string[] | null | undefined) {
  const sb = createAdminClient();
  const items = await Promise.all(
    (paths ?? []).map(async (path) => {
      const { data } = await sb.storage.from('payments').createSignedUrl(path, 60 * 60 * 24 * 7);
      return {
        path,
        name: path.split('/').pop() ?? path,
        url: data?.signedUrl ?? null,
      };
    }),
  );

  return items;
}

function buildManagerHref(clientIds: number[], yearMonth: string) {
  const params = new URLSearchParams();
  clientIds.forEach((clientId) => params.append('client', String(clientId)));
  params.set('month', yearMonth);
  return `/extras/monthly-settlement?${params.toString()}`;
}

export default async function MonthlySettlementEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reportId = Number(id);
  if (!Number.isFinite(reportId)) notFound();

  const { locale, t } = await getI18n();
  const localeCode = locale === 'ja' ? 'ja-JP' : 'ko-KR';
  const sb = createAdminClient();

  const { data: report, error } = await sb
    .from('monthly_settlement_reports')
    .select('id, client_ids, year_month, title, share_token, transactions, screenshot_paths, transfer_proof_paths, created_at')
    .eq('id', reportId)
    .single();

  if (error || !report) notFound();

  const { data: clients } = await sb
    .from('clients')
    .select('id, company_name')
    .in('id', report.client_ids ?? [])
    .order('company_name');

  const selectedClientLabel = (clients ?? []).map((item) => item.company_name).join(' / ');
  const previewData = await getMonthlySettlementReportData({
    clientIds: report.client_ids ?? [],
    yearMonth: report.year_month,
    report,
  });

  const [existingBankUploads, existingTransferUploads] = await Promise.all([
    signedUploads(report.screenshot_paths),
    signedUploads(report.transfer_proof_paths),
  ]);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t('monthlySettlement.editTitle')}</h1>
        <p className="text-sm text-gray-500">{t('monthlySettlement.editHelp')}</p>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow">
        <MonthlySettlementCreateForm
          mode="edit"
          selectedIds={report.client_ids ?? []}
          selectedMonth={report.year_month}
          title={`${displayMonth(report.year_month, localeCode)} ${t('monthlySettlement.reportSuffix')}`}
          selectedClientLabel={selectedClientLabel}
          initialTransactions={report.transactions ?? []}
          existingBankUploads={existingBankUploads}
          existingTransferUploads={existingTransferUploads}
          cancelHref={buildManagerHref(report.client_ids ?? [], report.year_month)}
          action={updateMonthlySettlementReportAction.bind(null, reportId)}
        />
      </section>

      <section className="space-y-3">
        <div className="space-y-1 px-1">
          <h2 className="text-lg font-semibold">{t('monthlySettlement.previewTitle')}</h2>
          <p className="text-sm text-gray-500">{t('monthlySettlement.previewHelp')}</p>
        </div>
        <MonthlySettlementReportView data={previewData} />
      </section>
    </div>
  );
}
