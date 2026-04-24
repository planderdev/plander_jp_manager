import { createClient } from '@/lib/supabase/server';
import { generateReportAction } from '@/actions/reports';
import DownloadButton from '@/components/report/DownloadButton';
import DeleteButton from '@/components/report/DeleteButton';
import SubmitButton from '@/components/SubmitButton';
import { dateLocale } from '@/lib/datetime';
import { getI18n } from '@/lib/i18n/server';
import Link from 'next/link';
import SortableHeaderLink from '@/components/table/SortableHeaderLink';
import { sortItems, type SortOrder } from '@/lib/table-sort';


export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: SortOrder }>;
}) {
  const currentSearchParams = await searchParams;
  const { locale, t } = await getI18n();
  const sb = await createClient();
  const [{ data: clients }, { data: reports }] = await Promise.all([
    sb.from('clients').select('id, company_name').order('company_name'),
    sb.from('reports').select('*, clients(company_name)').order('created_at', { ascending: false }),
  ]);
  const currentSort = currentSearchParams.sort ?? 'created_at';
  const currentOrder = currentSearchParams.order === 'asc' ? 'asc' : 'desc';
  const sortedReports = sortItems(reports ?? [], (report: any) => {
    switch (currentSort) {
      case 'company_name':
        return report.clients?.company_name;
      case 'year_month':
        return report.year_month;
      case 'file_name':
        return report.file_name;
      default:
        return report.created_at;
    }
  }, currentOrder);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold">{t('reports.manageTitle')}</h1>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t('reports.new')}</h2>
          <Link href="/extras/report-links" className="rounded-full border border-black px-4 py-2 text-sm font-medium text-black transition hover:bg-black hover:text-white">
            {t('reports.openGenerator')}
          </Link>
        </div>
        <form action={generateReportAction} className="bg-white p-6 rounded-lg shadow flex flex-wrap gap-4 items-end max-w-2xl">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm block mb-1 font-medium">{t('reports.company')}</label>
            <select name="client_id" required className="w-full border border-gray-400 rounded p-2">
              <option value="">{t('reports.select')}</option>
              {clients?.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">{t('reports.month')}</label>
            <input type="month" name="year_month" required className="border border-gray-400 rounded p-2" />
          </div>
          <SubmitButton>{t('reports.create')}</SubmitButton>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t('reports.generated')}</h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3"><SortableHeaderLink label={t('common.companyName')} sortKey="company_name" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
                <th className="p-3"><SortableHeaderLink label={t('metrics.month')} sortKey="year_month" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
                <th className="p-3"><SortableHeaderLink label={t('reports.fileName')} sortKey="file_name" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
                <th className="p-3"><SortableHeaderLink label={t('common.createdAt')} sortKey="created_at" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
                <th className="p-3">{t('common.management')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedReports.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.clients?.company_name}</td>
                  <td className="p-3">{r.year_month}</td>
                  <td className="p-3">{r.file_name}</td>
                  <td className="p-3">{new Date(r.created_at).toLocaleDateString(dateLocale(locale))}</td>
                  <td className="p-3 space-x-3">
                    <DownloadButton filePath={r.file_path} />
                    <DeleteButton id={r.id} />
                  </td>
                </tr>
              ))}
              {!sortedReports.length && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">{t('reports.none')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
