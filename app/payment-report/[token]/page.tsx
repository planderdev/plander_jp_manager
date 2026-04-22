import { notFound } from 'next/navigation';
import InternalPaymentReportView from '@/components/report/InternalPaymentReportView';
import { createAdminClient } from '@/lib/supabase/admin';
import { getI18n } from '@/lib/i18n/server';
import { getInternalPaymentReportData } from '@/lib/internal-payment-report';

export default async function PublicInternalPaymentReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { locale, t } = await getI18n();
  const sb = createAdminClient();
  const { data: report, error } = await sb
    .from('internal_payment_reports')
    .select('client_id, influencer_id, from_date, to_date')
    .eq('share_token', token)
    .single();

  if (error || !report) notFound();

  const data = await getInternalPaymentReportData({
    clientId: report.client_id,
    influencerId: report.influencer_id,
    fromDate: report.from_date,
    toDate: report.to_date,
  });

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-3 py-4 md:px-8 md:py-8">
      <InternalPaymentReportView locale={locale} t={t} data={data} />
    </main>
  );
}
