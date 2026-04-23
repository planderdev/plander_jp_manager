import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import MoneyText from '@/components/MoneyText';
import { getI18n } from '@/lib/i18n/server';

export default async function CompletedPage({
  searchParams,
}: { searchParams: Promise<{ handle?: string; company?: string }> }) {
  const { handle, company } = await searchParams;
  const { t } = await getI18n();
  const sb = await createClient();

  let q = sb.from('posts')
    .select('*, clients(company_name), influencers(handle, account_url, unit_price, name_en, bank_name, branch_name, account_number, phone, prefecture, city, street)')
    .not('post_url', 'is', null)
    .order('updated_at', { ascending: false });

  const { data: all } = await q;
  let posts = all ?? [];

  if (handle) posts = posts.filter((p: any) => p.influencers?.handle?.toLowerCase().includes(handle.toLowerCase()));
  if (company) posts = posts.filter((p: any) => p.clients?.company_name?.toLowerCase().includes(company.toLowerCase()));

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{t('completed.title')}</h1>
        <Link href="/influencers/posts/metrics"
          className="border border-gray-400 px-4 py-2 rounded text-sm hover:bg-gray-100">
          {t('completed.metricsEntry')}
        </Link>
      </div>

      <form className="mb-4 flex flex-wrap gap-2">
        <input name="handle" defaultValue={handle ?? ''} placeholder={t('completed.handlePlaceholder')}
          className="border border-gray-400 rounded p-2 text-sm" />
        <input name="company" defaultValue={company ?? ''} placeholder={t('completed.companyPlaceholder')}
          className="border border-gray-400 rounded p-2 text-sm" />
        <button className="bg-black text-white px-4 py-2 rounded text-sm">{t('completed.search')}</button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">{t('common.companyName')}</th>
              <th className="p-3">{t('common.influencer')}</th>
              <th className="p-3">{t('postForm.accountLink')}</th>
              <th className="p-3">{t('common.post')}</th>
              <th className="p-3">{t('common.views')}</th>
              <th className="p-3">{t('common.likes')}</th>
              <th className="p-3">{t('common.comments')}</th>
              <th className="p-3">{t('common.shares')}</th>
              <th className="p-3">{t('common.unitPrice')}</th>
              <th className="p-3">{t('postForm.settlementCount')}</th>
              <th className="p-3">{t('postForm.settlementAmount')}</th>
              <th className="p-3">{t('postForm.settlementStatus')}</th>
              <th className="p-3">{t('postForm.settledOn')}</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.clients?.company_name}</td>
                <td className="p-3">
                  <Link href={`/influencers/${p.influencer_id}`} className="text-blue-600 hover:underline">
                    @{p.influencers?.handle}
                  </Link>
                </td>
                <td className="p-3">
                  {p.influencers?.account_url && (
                    <a href={p.influencers.account_url} target="_blank" className="text-blue-600 hover:underline">{t('common.link')}</a>
                  )}
                </td>
                <td className="p-3">
                  <a href={p.post_url} target="_blank" className="text-blue-600 hover:underline">{t('common.link')}</a>
                </td>
                <td className="p-3">{p.views?.toLocaleString()}</td>
                <td className="p-3">{p.likes?.toLocaleString()}</td>
                <td className="p-3">{p.comments?.toLocaleString()}</td>
                <td className="p-3">{p.shares?.toLocaleString()}</td>
                <td className="p-3"><MoneyText value={p.influencers?.unit_price} suffix=" JPY" /></td>
                <td className="p-3">{(p.settlement_count ?? 1).toLocaleString()}</td>
                <td className="p-3"><MoneyText value={(p.influencers?.unit_price ?? 0) * (p.settlement_count ?? 1) * 10} /></td>
                <td className="p-3">
                  <span className={p.settlement_status === 'done' ? 'text-green-600' : 'text-orange-500'}>
                    {p.settlement_status === 'done' ? t('schedule.done') : t('postForm.pending')}
                  </span>
                </td>
                <td className="p-3">{p.settled_on?.replaceAll('-', '/') ?? '-'}</td>
              </tr>
            ))}
            {!posts.length && (
              <tr><td colSpan={13} className="p-8 text-center text-gray-400">{t('completed.none')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
