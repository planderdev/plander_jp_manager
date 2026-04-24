import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { clientStatusLabel } from '@/lib/labels';
import MoneyText from '@/components/MoneyText';
import { getI18n } from '@/lib/i18n/server';
import SortableHeaderLink from '@/components/table/SortableHeaderLink';
import { sortItems, type SortOrder } from '@/lib/table-sort';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: SortOrder }>;
}) {
  const currentSearchParams = await searchParams;
  const { locale, t } = await getI18n();
  const sb = await createClient();
  const { data: clients } = await sb
    .from('clients')
    .select('*')
    .in('status', ['active', 'paused', 'ended'])
    .order('created_at', { ascending: false });

  const currentSort = currentSearchParams.sort ?? 'created_at';
  const currentOrder = currentSearchParams.order === 'asc' ? 'asc' : 'desc';

  const sortedClients = sortItems(clients ?? [], (client) => {
    switch (currentSort) {
      case 'company_name':
        return client.company_name;
      case 'contact_person':
        return client.contact_person;
      case 'phone':
        return client.phone;
      case 'status':
        return client.status;
      case 'contract_period':
        return client.contract_start;
      case 'contract_amount':
        return client.contract_amount ?? 0;
      default:
        return client.created_at;
    }
  }, currentOrder);

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
              <th className="p-3"><SortableHeaderLink label={t('common.companyName')} sortKey="company_name" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('sales.owner')} sortKey="contact_person" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.contact')} sortKey="phone" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.status')} sortKey="status" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.contractPeriod')} sortKey="contract_period" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.contractAmount')} sortKey="contract_amount" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
            </tr>
          </thead>
          <tbody>
            {sortedClients.map((c) => (
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
            {!sortedClients.length && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">{t('client.none')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
