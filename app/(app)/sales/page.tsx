import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { clientStatusLabel, clientStatusClass, isInactiveClient, isActivePipeline } from '@/lib/labels';
import MoneyText from '@/components/MoneyText';
import { getI18n } from '@/lib/i18n/server';

export default async function SalesPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; category?: string; region?: string; owner?: string; q?: string }> }) {
  const { status, category, region, owner, q } = await searchParams;
  const { locale, t } = await getI18n();
  const sb = await createClient();

  let query = sb.from('clients')
    .select('*, owner:admins!clients_owner_id_fkey(id, name)')
    .order('first_contact_date', { ascending: false, nullsFirst: false });

  if (status && status !== 'active_pipeline') {
    query = query.eq('status', status);
  }
  if (category) query = query.eq('category', category);
  if (region) query = query.eq('sales_region', region);
  if (owner) query = query.eq('owner_id', owner);
  if (q) query = query.ilike('company_name', `%${q}%`);

  const { data: clientsRaw } = await query;
  let clients = clientsRaw ?? [];

  // 기본값: 활성 파이프라인만
  if (!status) {
    clients = clients.filter(c => isActivePipeline(c.status));
  } else if (status === 'active_pipeline') {
    clients = clients.filter(c => isActivePipeline(c.status));
  }

  const [{ data: admins }, { data: options }] = await Promise.all([
    sb.from('admins').select('id, name').order('name'),
    sb.from('client_options').select('*').order('value'),
  ]);
  const categoryOptions = (options ?? []).filter(o => o.kind === 'category');
  const regionOptions = (options ?? []).filter(o => o.kind === 'sales_region');

  const { data: allForCount } = await sb.from('clients').select('status');
  const counts: Record<string, number> = {};
  for (const c of allForCount ?? []) counts[c.status] = (counts[c.status] ?? 0) + 1;

  const summaryCards = [
    { label: t('sales.status.contacted'), key: 'contacted', color: 'bg-blue-500' },
    { label: t('sales.status.proposed'), key: 'proposed', color: 'bg-purple-500' },
    { label: t('sales.status.negotiating'), key: 'negotiating', color: 'bg-amber-500' },
    { label: t('sales.status.active'), key: 'active', color: 'bg-red-500' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{t('sales.title')}</h1>
        <Link href="/campaigns/clients/new" className="bg-black text-white px-4 py-2 rounded">
          {t('sales.newClient')}
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <Link key={c.key} href={`/sales?status=${c.key}`}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
            <div className={`inline-block w-2 h-2 rounded-full ${c.color} mb-1`}></div>
            <div className="text-xs text-gray-600">{c.label}</div>
            <div className="text-2xl font-bold">{counts[c.key] ?? 0}</div>
          </Link>
        ))}
      </div>

      <form className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm block mb-1 font-medium">{t('common.status')}</label>
          <select name="status" defaultValue={status ?? ''} className="border border-gray-400 rounded p-2 text-sm">
            <option value="">{t('sales.onlyActive')}</option>
            <option value="contacted">{t('sales.status.contacted')}</option>
            <option value="proposed">{t('sales.status.proposed')}</option>
            <option value="negotiating">{t('sales.status.negotiating')}</option>
            <option value="active">{t('sales.status.active')}</option>
            <option value="paused">{t('sales.status.paused')}</option>
            <option value="ended">{t('sales.status.ended')}</option>
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">{t('common.category')}</label>
          <select name="category" defaultValue={category ?? ''} className="border border-gray-400 rounded p-2 text-sm">
            <option value="">{t('common.all')}</option>
            {categoryOptions.map((o) => (
              <option key={o.id} value={o.value}>{o.value}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">{t('common.region')}</label>
          <select name="region" defaultValue={region ?? ''} className="border border-gray-400 rounded p-2 text-sm">
            <option value="">{t('common.all')}</option>
            {regionOptions.map((o) => (
              <option key={o.id} value={o.value}>{o.value}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">{t('sales.owner')}</label>
          <select name="owner" defaultValue={owner ?? ''} className="border border-gray-400 rounded p-2 text-sm">
            <option value="">{t('common.all')}</option>
            {admins?.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-sm block mb-1 font-medium">{t('sales.searchCompany')}</label>
          <input type="text" name="q" defaultValue={q ?? ''} placeholder={t('sales.searchPlaceholder')}
            className="border border-gray-400 rounded p-2 text-sm w-full" />
        </div>
        <button className="bg-black text-white px-4 py-2 rounded text-sm">{t('common.search')}</button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">{t('common.companyName')}</th>
              <th className="p-3">{t('common.category')}</th>
              <th className="p-3">{t('common.region')}</th>
              <th className="p-3">{t('common.contact')}</th>
              <th className="p-3">{t('common.phone')}</th>
              <th className="p-3">{t('sales.firstContact')}</th>
              <th className="p-3">{t('common.status')}</th>
              <th className="p-3">{t('common.contractAmount')}</th>
              <th className="p-3">{t('sales.contractDate')}</th>
              <th className="p-3">{t('sales.assignee')}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c: any) => {
              const inactive = isInactiveClient(c.status);
              return (
                <tr key={c.id} className={`border-t ${inactive ? 'bg-gray-50 text-gray-400' : ''}`}>
                  <td className="p-3 font-medium">
                    <Link href={`/campaigns/clients/${c.id}`}
                      className={inactive ? 'hover:underline' : 'text-blue-600 hover:underline'}>
                      {c.company_name}
                    </Link>
                  </td>
                  <td className="p-3">{c.category ?? '-'}</td>
                  <td className="p-3">{c.sales_region ?? '-'}</td>
                  <td className="p-3">{c.contact_person ?? '-'}</td>
                  <td className="p-3">{c.phone ?? '-'}</td>
                  <td className="p-3">{c.first_contact_date ?? '-'}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${clientStatusClass(c.status)}`}>
                      {clientStatusLabel(c.status, locale)}
                    </span>
                  </td>
                  <td className="p-3"><MoneyText value={c.contract_amount} /></td>
                  <td className="p-3">{c.contract_start ?? '-'}</td>
                  <td className="p-3">{c.owner?.name ?? '-'}</td>
                </tr>
              );
            })}
            {!clients.length && (
              <tr><td colSpan={10} className="p-8 text-center text-gray-400">{t('sales.noResults')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
