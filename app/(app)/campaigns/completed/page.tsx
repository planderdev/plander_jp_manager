import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import MoneyText from '@/components/MoneyText';
import { getI18n } from '@/lib/i18n/server';
import SortableHeaderLink from '@/components/table/SortableHeaderLink';
import { sortItems, type SortOrder } from '@/lib/table-sort';

export default async function CompletedPage({
  searchParams,
}: { searchParams: Promise<{ handle?: string; company?: string; sort?: string; order?: SortOrder }> }) {
  const currentSearchParams = await searchParams;
  const { handle, company } = currentSearchParams;
  const { t } = await getI18n();
  const sb = await createClient();

  let q = sb.from('posts')
    .select('*, clients(company_name), influencers(handle, account_url, unit_price, name_en, bank_name, branch_name, account_number, phone, prefecture, city, street)')
    .in('settlement_status', ['payable', 'done'])
    .order('updated_at', { ascending: false });

  const { data: all } = await q;
  let posts = all ?? [];

  if (handle) posts = posts.filter((p: any) => p.influencers?.handle?.toLowerCase().includes(handle.toLowerCase()));
  if (company) posts = posts.filter((p: any) => p.clients?.company_name?.toLowerCase().includes(company.toLowerCase()));

  const statusOrder: Record<string, number> = { payable: 0, done: 1 };
  const currentSort = currentSearchParams.sort ?? 'updated_at';
  const currentOrder = currentSearchParams.order === 'asc' ? 'asc' : 'desc';
  const sortedPosts = sortItems(posts, (post: any) => {
    switch (currentSort) {
      case 'company_name':
        return post.clients?.company_name;
      case 'handle':
        return post.influencers?.handle;
      case 'account_url':
        return post.influencers?.account_url;
      case 'post_url':
        return post.post_url;
      case 'views':
        return post.views ?? 0;
      case 'likes':
        return post.likes ?? 0;
      case 'comments':
        return post.comments ?? 0;
      case 'unit_price':
        return post.influencers?.unit_price ?? 0;
      case 'settlement_amount':
        return (post.influencers?.unit_price ?? 0) * 10;
      case 'settlement_status':
        return statusOrder[post.settlement_status] ?? 99;
      case 'settled_on':
        return post.settled_on ?? '';
      default:
        return post.updated_at;
    }
  }, currentOrder);

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
        <input type="hidden" name="sort" value={currentSort} />
        <input type="hidden" name="order" value={currentOrder} />
        <button className="bg-black text-white px-4 py-2 rounded text-sm">{t('completed.search')}</button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3"><SortableHeaderLink label={t('common.companyName')} sortKey="company_name" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.influencer')} sortKey="handle" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('postForm.accountLink')} sortKey="account_url" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.post')} sortKey="post_url" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.views')} sortKey="views" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.likes')} sortKey="likes" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.comments')} sortKey="comments" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.unitPrice')} sortKey="unit_price" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('postForm.settlementAmount')} sortKey="settlement_amount" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('postForm.settlementStatus')} sortKey="settlement_status" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('postForm.settledOn')} sortKey="settled_on" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
            </tr>
          </thead>
          <tbody>
            {sortedPosts.map((p: any) => (
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
                  {p.post_url ? (
                    <a href={p.post_url} target="_blank" className="text-blue-600 hover:underline">{t('common.link')}</a>
                  ) : (
                    <span className="text-gray-400">{t('reportMockup.uploadPending')}</span>
                  )}
                </td>
                <td className="p-3">{p.views?.toLocaleString()}</td>
                <td className="p-3">{p.likes?.toLocaleString()}</td>
                <td className="p-3">{p.comments?.toLocaleString()}</td>
                <td className="p-3"><MoneyText value={p.influencers?.unit_price} suffix=" JPY" /></td>
                <td className="p-3"><MoneyText value={(p.influencers?.unit_price ?? 0) * 10} /></td>
                <td className="p-3">
                  <span className={p.settlement_status === 'done' ? 'text-green-600' : 'text-red-500'}>
                    {p.settlement_status === 'done' ? t('postForm.done') : t('postForm.payable')}
                  </span>
                </td>
                <td className="p-3">{p.settled_on?.replaceAll('-', '/') ?? '-'}</td>
              </tr>
            ))}
            {!sortedPosts.length && (
              <tr><td colSpan={11} className="p-8 text-center text-gray-400">{t('completed.none')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
