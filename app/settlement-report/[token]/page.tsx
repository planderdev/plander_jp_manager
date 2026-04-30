import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMonthlySettlementReportData } from '@/lib/monthly-settlement-report';
import MonthlySettlementReportView from '@/components/report/MonthlySettlementReportView';

export default async function PublicMonthlySettlementReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const sb = createAdminClient();
  const { data: report, error } = await sb
    .from('monthly_settlement_reports')
    .select('client_ids, year_month, transactions, screenshot_paths, transfer_proof_paths, created_at')
    .eq('share_token', token)
    .single();

  if (error || !report) notFound();

  const data = await getMonthlySettlementReportData({
    clientIds: report.client_ids ?? [],
    yearMonth: report.year_month,
    report,
  });

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-3 py-4 md:px-8 md:py-8">
      <MonthlySettlementReportView data={data} />
    </main>
  );
}
