import SharedReportView from '@/components/report/SharedReportView';
import { createAdminClient } from '@/lib/supabase/admin';
import { getI18n } from '@/lib/i18n/server';
import { getReportViewData } from '@/lib/report-links';

type SearchParams = Promise<{ client?: string; month?: string }>;

export default async function ReportMockupPage({ searchParams }: { searchParams: SearchParams }) {
  const { client, month } = await searchParams;
  const { locale, t } = await getI18n();
  const sb = createAdminClient();
  const { data: clients } = await sb
    .from('clients')
    .select('id')
    .order('company_name');

  const currentMonth = month || new Date().toISOString().slice(0, 7);
  const selectedClientId = client ? Number(client) : clients?.[0]?.id;

  if (!selectedClientId) {
    return (
      <div className="p-8 text-sm text-gray-500">
        No client data.
      </div>
    );
  }

  const data = await getReportViewData(selectedClientId, currentMonth);
  return <SharedReportView locale={locale} t={t} data={data} />;
}
