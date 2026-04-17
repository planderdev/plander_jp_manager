import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { shortLocalized } from '@/lib/datetime';
import { clientStatusLabel } from '@/lib/labels';
import { getScheduleStatus } from '@/lib/schedule-status';
import { autoCreatePostsFromPastSchedules } from '@/actions/posts';
import { getI18n } from '@/lib/i18n/server';

export default async function DashboardPage() {
  await autoCreatePostsFromPastSchedules();
  const { locale, t } = await getI18n();
  
  const sb = await createClient();

  const [
    { count: influencerCount },
    { count: clientCount },
    { data: allSchedules },
    { data: clients },
  ] = await Promise.all([
    sb.from('influencers').select('id', { count: 'exact', head: true }),
    sb.from('clients').select('id', { count: 'exact', head: true }),
    sb.from('schedules')
      .select('*, clients(company_name), influencers(id, handle), posts(post_url, settlement_status)')
      .order('scheduled_at', { ascending: true }),
    sb.from('clients')
      .select('id, company_name, contact_person, phone, status, contract_start, contract_end')
      .eq('status', 'active')
      .order('company_name'),
  ]);

  let reserved = 0, uploadPending = 0, settlementPending = 0, done = 0;
  const uploadPendingList: any[] = [];
  const settlementPendingList: any[] = [];

  for (const s of allSchedules ?? []) {
    const st = getScheduleStatus(s.scheduled_at, s.posts);
    if (st === 'reserved') reserved++;
    else if (st === 'upload_pending') { uploadPending++; uploadPendingList.push(s); }
    else if (st === 'settlement_pending') { settlementPending++; settlementPendingList.push(s); }
    else if (st === 'done') done++;
  }

  const cards = [
    { label: t('dashboard.totalClients'), value: clientCount ?? 0, href: '/sales', color: 'bg-purple-600' },
    { label: t('dashboard.totalInfluencers'), value: influencerCount ?? 0, href: '/influencers', color: 'bg-green-600' },
    { label: t('dashboard.reserved'), value: reserved, href: '/campaigns/schedules', color: 'bg-orange-500' },
    { label: t('dashboard.uploadPending'), value: uploadPending, href: '/influencers/posts', color: 'bg-red-500' },
    { label: t('dashboard.settlementPending'), value: settlementPending, href: '/influencers/posts', color: 'bg-red-500' },
    { label: t('dashboard.done'), value: done, href: '/campaigns/completed', color: 'bg-green-600' },
  ];

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}
            className="bg-white rounded-lg shadow p-5 hover:shadow-md transition">
            <div className={`inline-block w-2 h-2 rounded-full ${c.color} mb-2`}></div>
            <div className="text-sm text-gray-600">{c.label}</div>
            <div className="text-3xl font-bold mt-1">{c.value.toLocaleString()}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-5">
          <Link href="/influencers/posts" className="text-lg font-semibold mb-4 block hover:text-blue-600">
            {t('dashboard.uploadPendingTop')}
          </Link>
          {uploadPendingList.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('common.none')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr><th className="p-2">{t('common.shootDate')}</th><th className="p-2">{t('common.influencer')}</th><th className="p-2">{t('common.companyName')}</th></tr>
                </thead>
                <tbody>
                  {uploadPendingList.slice(0, 10).map((s: any) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-2">{shortLocalized(s.scheduled_at, locale)}</td>
                      <td className="p-2">
                        <Link href={`/influencers/${s.influencers?.id}`} className="text-blue-600 hover:underline">
                          @{s.influencers?.handle}
                        </Link>
                      </td>
                      <td className="p-2">{s.clients?.company_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <Link href="/influencers/posts" className="text-lg font-semibold mb-4 block hover:text-blue-600">
            {t('dashboard.settlementPendingTop')}
          </Link>
          {settlementPendingList.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('common.none')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr><th className="p-2">{t('common.shootDate')}</th><th className="p-2">{t('common.influencer')}</th><th className="p-2">{t('common.companyName')}</th></tr>
                </thead>
                <tbody>
                  {settlementPendingList.slice(0, 10).map((s: any) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-2">{shortLocalized(s.scheduled_at, locale)}</td>
                      <td className="p-2">
                        <Link href={`/influencers/${s.influencers?.id}`} className="text-blue-600 hover:underline">
                          @{s.influencers?.handle}
                        </Link>
                      </td>
                      <td className="p-2">{s.clients?.company_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <Link href="/campaigns/clients" className="text-lg font-semibold mb-4 block hover:text-blue-600">
          {t('dashboard.clientList')}
        </Link>
        {(clients ?? []).length === 0 ? (
          <p className="text-gray-400 text-sm">{t('dashboard.noClients')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2">{t('common.companyName')}</th>
                  <th className="p-2">{t('sales.owner')}</th>
                  <th className="p-2">{t('common.contact')}</th>
                  <th className="p-2">{t('common.status')}</th>
                  <th className="p-2">{t('common.contractPeriod')}</th>
                </tr>
              </thead>
              <tbody>
                {clients?.map((c: any) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2 font-medium">
                      <Link href={`/campaigns/clients/${c.id}`} className="text-blue-600 hover:underline">
                        {c.company_name}
                      </Link>
                    </td>
                    <td className="p-2">{c.contact_person ?? '-'}</td>
                    <td className="p-2">{c.phone ?? '-'}</td>
                    <td className="p-2">{clientStatusLabel(c.status, locale)}</td>
                    <td className="p-2">{c.contract_start ?? '-'} ~ {c.contract_end ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
