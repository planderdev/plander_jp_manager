import { notFound } from 'next/navigation';
import SharedReportView from '@/components/report/SharedReportView';
import { getI18n } from '@/lib/i18n/server';
import { getReportViewData } from '@/lib/report-links';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function PublicReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { locale, t } = await getI18n();
  const sb = createAdminClient();
  const { data: report } = await sb
    .from('shared_reports')
    .select('client_id, year_month')
    .eq('share_token', token)
    .single();

  if (!report) notFound();

  const data = await getReportViewData(report.client_id, report.year_month);
  return <SharedReportView locale={locale} t={t} data={data} />;
}
