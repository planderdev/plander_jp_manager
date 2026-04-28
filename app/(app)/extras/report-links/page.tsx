import Link from 'next/link';
import SubmitButton from '@/components/SubmitButton';
import CopyLinkButton from '@/components/report/CopyLinkButton';
import SharedDeleteButton from '@/components/report/SharedDeleteButton';
import { createSharedReportAction } from '@/actions/report-links';
import { createAdminClient } from '@/lib/supabase/admin';
import { getI18n } from '@/lib/i18n/server';
import { displayMonth } from '@/lib/report-links';

type SearchParams = Promise<{ client?: string | string[]; month?: string }>;

function selectedClientIds(value: string | string[] | undefined, fallbackId?: number) {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const ids = raw.map(Number).filter(Boolean);
  if (ids.length) return Array.from(new Set(ids));
  return fallbackId ? [fallbackId] : [];
}

export default async function ReportLinksPage({ searchParams }: { searchParams: SearchParams }) {
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

  const { data: reports } = selectedIds.length
    ? await sb
        .from('shared_reports')
        .select('id, client_id, client_ids, year_month, title, share_token, created_at')
        .contains('client_ids', selectedIds)
        .order('year_month', { ascending: false })
    : { data: [] as Array<{ id: number; client_id: number; client_ids: number[] | null; year_month: string; title: string; share_token: string; created_at: string }> };

  const selectedClients = clients?.filter((item) => selectedIds.includes(item.id)) ?? [];
  const selectedClientLabel = selectedClients.map((item) => item.company_name).join(' / ');
  const pendingTitle = `${displayMonth(selectedMonth, localeCode)} ${t('reports.reportSuffix')}`;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t('reports.linkManagerTitle')}</h1>
        <p className="text-sm text-gray-500">{t('reports.linkManagerDescription')}</p>
      </div>

      <section className="bg-white rounded-3xl shadow p-6 space-y-5">
        <form className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px_auto] md:items-end">
          <div>
            <label className="text-sm block mb-1 font-medium">{t('reports.company')}</label>
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
            <label className="text-sm block mb-1 font-medium">{t('reports.month')}</label>
            <input type="month" name="month" defaultValue={selectedMonth} className="w-full border border-gray-300 rounded-xl p-3" />
          </div>
          <button className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white">
            {t('common.search')}
          </button>
        </form>

        <div className="rounded-3xl border border-gray-200 bg-[#fafaf8] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{t('reports.new')}</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{pendingTitle}</h2>
              <p className="mt-1 text-sm text-gray-500">{selectedClientLabel || '-'}</p>
            </div>
            <form action={createSharedReportAction} className="flex items-center gap-3">
              {selectedIds.map((clientId) => (
                <input key={clientId} type="hidden" name="client_ids" value={clientId} />
              ))}
              <input type="hidden" name="year_month" value={selectedMonth} />
              <input type="hidden" name="locale" value={locale} />
              <SubmitButton>{t('reports.createLink')}</SubmitButton>
            </form>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold">{t('reports.generatedLinks')}</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {reports?.map((report) => (
            <div key={report.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <Link href={`/report/${report.share_token}`} target="_blank" className="text-base font-semibold text-gray-900 hover:underline">
                  {report.title || `${displayMonth(report.year_month, localeCode)} ${t('reports.reportSuffix')}`}
                </Link>
                <p className="mt-1 text-sm text-gray-500">
                  {report.year_month}
                  {' · '}
                  {clients
                    ?.filter((item) => (report.client_ids?.length ? report.client_ids : [report.client_id]).includes(item.id))
                    .map((item) => item.company_name)
                    .join(' / ') || '-'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <CopyLinkButton token={report.share_token} />
                <Link href={`/report/${report.share_token}`} target="_blank" className="text-emerald-700 hover:underline">
                  {t('common.link')}
                </Link>
                <SharedDeleteButton id={report.id} clientIds={selectedIds} yearMonth={report.year_month} />
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
    </div>
  );
}
