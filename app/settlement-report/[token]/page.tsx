import { notFound } from 'next/navigation';
import StandaloneSwipeBack from '@/components/StandaloneSwipeBack';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMonthlySettlementReportData } from '@/lib/monthly-settlement-report';
import MonthlySettlementReportView from '@/components/report/MonthlySettlementReportView';
import type { SortOrder } from '@/lib/table-sort';

export default async function PublicMonthlySettlementReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{
    transaction_sort?: string;
    transaction_order?: SortOrder;
    post_sort?: string;
    post_order?: SortOrder;
  }>;
}) {
  const { token } = await params;
  const currentSearchParams = await searchParams;
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
      <StandaloneSwipeBack />
      <MonthlySettlementReportView
        data={data}
        transactionSort={currentSearchParams.transaction_sort}
        transactionOrder={currentSearchParams.transaction_order === 'asc' ? 'asc' : 'desc'}
        postSort={currentSearchParams.post_sort}
        postOrder={currentSearchParams.post_order === 'asc' ? 'asc' : 'desc'}
        searchParams={currentSearchParams}
      />
    </main>
  );
}
