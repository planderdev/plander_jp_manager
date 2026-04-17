import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { clientStatusLabel } from '@/lib/labels';
import MoneyText from '@/components/MoneyText';
import { getI18n } from '@/lib/i18n/server';

export default async function ClientsPage() {
  const { locale, t } = await getI18n();
  const sb = await createClient();
  const { data: clients } = await sb
    .from('clients')
    .select('*')
    .in('status', ['active', 'paused', 'ended'])
    .order('created_at', { ascending: false });

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{t('client.listTitle')}</h1>
        <div className="text-xs text-gray-500">
          {t('client.preContractPrefix')}
          <Link href="/sales" className="text-blue-600 hover:underline">{t('sales.title')}</Link>
          {t('client.preContractSuffix')}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">{t('common.companyName')}</th>
              <th className="p-3">{t('sales.owner')}</th>
              <th className="p-3">{t('common.contact')}</th>
              <th className="p-3">{t('common.status')}</th>
              <th className="p-3">{t('common.contractPeriod')}</th>
              <th className="p-3">{t('common.contractAmount')}</th>
            </tr>
          </thead>
          <tbody>
            {clients?.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">
                  <Link href={`/campaigns/clients/${c.id}`} className="text-blue-600 hover:underline">
                    {c.company_name}
                  </Link>
                </td>
                <td className="p-3">{c.contact_person ?? '-'}</td>
                <td className="p-3">{c.phone ?? '-'}</td>
                <td className="p-3">{clientStatusLabel(c.status, locale)}</td>
                <td className="p-3">{c.contract_start ?? '-'} ~ {c.contract_end ?? '-'}</td>
                <td className="p-3"><MoneyText value={c.contract_amount} /></td>
              </tr>
            ))}
            {!clients?.length && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">{t('client.none')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
