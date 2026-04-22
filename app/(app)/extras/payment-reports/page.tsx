import { createClient } from '@/lib/supabase/server';
import { getI18n } from '@/lib/i18n/server';
import InternalPaymentReportView from '@/components/report/InternalPaymentReportView';
import { getInternalPaymentReportData } from '@/lib/internal-payment-report';
import SubmitButton from '@/components/SubmitButton';
import CopyLinkButton from '@/components/report/CopyLinkButton';
import InternalPaymentDeleteButton from '@/components/report/InternalPaymentDeleteButton';
import { createInternalPaymentReportAction } from '@/actions/report-links';
import Link from 'next/link';

function parseYmd(value?: string) {
  if (!value) return null;
  const clean = value.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
}

function defaultRange() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const from = `${year}-${month}-01`;
  const to = `${year}-${month}-${day}`;
  return { from, to };
}

export default async function PaymentReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; influencer?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { locale, t } = await getI18n();
  const sb = await createClient();
  const [{ data: clients }, { data: influencers }] = await Promise.all([
    sb.from('clients').select('id, company_name').order('company_name'),
    sb.from('influencers').select('id, handle').order('handle'),
  ]);

  const fallbackRange = defaultRange();
  const fromDate = parseYmd(params.from) ?? fallbackRange.from;
  const toDate = parseYmd(params.to) ?? fallbackRange.to;
  const clientId = params.client ? Number(params.client) : null;
  const influencerId = params.influencer ? Number(params.influencer) : null;

  let rangeError = '';
  if (fromDate && toDate) {
    const diff = (new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24);
    if (diff > 366) rangeError = t('stats.dateRangeTooLong');
    if (diff < 0) rangeError = t('stats.invalidDateRange');
  }

  const reportData = rangeError
    ? null
    : await getInternalPaymentReportData({ clientId, influencerId, fromDate, toDate });
  const { data: generatedReports } = await sb
    .from('internal_payment_reports')
    .select('id, client_id, influencer_id, from_date, to_date, title, share_token, created_at, clients(company_name), influencers(handle)')
    .order('created_at', { ascending: false })
    .limit(30);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold">{t('paymentReport.menuTitle')}</h1>
        <p className="mt-2 text-sm text-gray-500">{t('paymentReport.help')}</p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow">
        <div>
          <label className="mb-1 block text-sm font-medium">{t('common.company')}</label>
          <select name="client" defaultValue={params.client ?? ''} className="rounded border border-gray-400 p-2 text-sm">
            <option value="">{t('common.all')}</option>
            {clients?.map((client) => (
              <option key={client.id} value={client.id}>{client.company_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t('common.influencer')}</label>
          <select name="influencer" defaultValue={params.influencer ?? ''} className="rounded border border-gray-400 p-2 text-sm">
            <option value="">{t('common.all')}</option>
            {influencers?.map((influencer) => (
              <option key={influencer.id} value={influencer.id}>@{influencer.handle}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t('common.startDate')}</label>
          <input type="date" name="from" defaultValue={fromDate} className="rounded border border-gray-400 p-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t('common.endDate')}</label>
          <input type="date" name="to" defaultValue={toDate} className="rounded border border-gray-400 p-2 text-sm" />
        </div>
        <button className="rounded bg-black px-4 py-2 text-sm text-white">{t('common.search')}</button>
      </form>

      {rangeError ? (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{rangeError}</div>
      ) : reportData ? (
        <>
          <section className="rounded-3xl bg-white p-6 shadow">
            <div className="rounded-3xl border border-gray-200 bg-[#fafaf8] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{t('reports.new')}</p>
              <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t('paymentReport.linkTitle')}</h2>
                  <p className="mt-1 text-sm text-gray-500">{reportData.periodLabel}</p>
                </div>
                <form action={createInternalPaymentReportAction} className="flex items-center gap-3">
                  <input type="hidden" name="client_id" value={clientId ?? ''} />
                  <input type="hidden" name="influencer_id" value={influencerId ?? ''} />
                  <input type="hidden" name="from_date" value={fromDate ?? ''} />
                  <input type="hidden" name="to_date" value={toDate ?? ''} />
                  <SubmitButton>{t('reports.createLink')}</SubmitButton>
                </form>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl bg-white shadow">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold">{t('reports.generatedLinks')}</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {generatedReports?.map((report: any) => (
                <div key={report.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Link href={`/payment-report/${report.share_token}`} target="_blank" className="text-base font-semibold text-gray-900 hover:underline">
                      {report.title}
                    </Link>
                    <p className="mt-1 text-sm text-gray-500">
                      {[report.clients?.company_name, report.influencers?.handle ? `@${report.influencers.handle}` : null, [report.from_date, report.to_date].filter(Boolean).join(' ~ ')]
                        .filter(Boolean)
                        .join(' · ') || t('common.all')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <CopyLinkButton token={report.share_token} basePath="/payment-report" />
                    <Link href={`/payment-report/${report.share_token}`} target="_blank" className="text-emerald-700 hover:underline">
                      {t('common.link')}
                    </Link>
                    <InternalPaymentDeleteButton
                      id={report.id}
                      clientId={clientId}
                      influencerId={influencerId}
                      fromDate={fromDate}
                      toDate={toDate}
                    />
                  </div>
                </div>
              ))}

              {!generatedReports?.length && (
                <div className="px-6 py-10 text-center text-sm text-gray-400">
                  {t('reports.none')}
                </div>
              )}
            </div>
          </section>

          <InternalPaymentReportView locale={locale} t={t} data={reportData} />
        </>
      ) : null}
    </div>
  );
}
