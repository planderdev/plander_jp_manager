import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import DeleteButton from '@/components/post/DeleteButton';
import { autoCreatePostsFromPastSchedules } from '@/actions/posts';
import { getI18n } from '@/lib/i18n/server';
import SortableHeaderLink from '@/components/table/SortableHeaderLink';
import { sortItems, type SortOrder } from '@/lib/table-sort';
import QuickSettlementStatusForm from '@/components/post/QuickSettlementStatusForm';

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: SortOrder }>;
}) {
  const currentSearchParams = await searchParams;
  const { t } = await getI18n();
  await autoCreatePostsFromPastSchedules();

  const sb = await createClient();
  const { data: posts } = await sb
    .from('posts')
    .select('*, clients(company_name), influencers(handle, unit_price)')
    .order('updated_at', { ascending: false });

  const statusOrder: Record<string, number> = {
    pending: 0,
    payable: 1,
    done: 2,
  };
  const currentSort = currentSearchParams.sort ?? 'settlement_status';
  const currentOrder = currentSearchParams.order === 'desc' ? 'desc' : 'asc';

  const sortedPosts = sortItems(posts ?? [], (post: any) => {
    switch (currentSort) {
      case 'company_name':
        return post.clients?.company_name;
      case 'handle':
        return post.influencers?.handle;
      case 'post_url':
        return post.post_url ?? '';
      case 'uploaded_on':
        return post.uploaded_on ?? '';
      case 'settlement_amount':
        return (post.influencers?.unit_price ?? 0) * 10;
      case 'settled_on':
        return post.settled_on ?? '';
      default:
        return statusOrder[post.settlement_status] ?? 99;
    }
  }, currentOrder);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{t('posts.title')}</h1>
        <div className="flex gap-2">
          <Link href="/influencers/posts/new" className="bg-black text-white px-4 py-2 rounded">{t('posts.new')}</Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3"><SortableHeaderLink label={t('common.companyName')} sortKey="company_name" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.influencer')} sortKey="handle" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.post')} sortKey="post_url" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.uploadDate')} sortKey="uploaded_on" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('postForm.settlementAmount')} sortKey="settlement_amount" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('postForm.settlementStatus')} sortKey="settlement_status" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('postForm.settledOn')} sortKey="settled_on" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3">{t('common.management')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedPosts.map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.clients?.company_name ?? '-'}</td>
                <td className="p-3">
                  <Link href={`/influencers/${p.influencer_id}`} className="text-blue-600 hover:underline">
                    @{p.influencers?.handle}
                  </Link>
                </td>
                <td className="p-3">
                  {p.post_url
                    ? <a href={p.post_url} target="_blank" className="text-blue-600 hover:underline">{t('common.link')}</a>
                    : <span className="text-gray-400">{t('posts.uploaded')}</span>}
                </td>
                <td className="p-3">{p.uploaded_on ?? '-'}</td>
                <td className="p-3">{((p.influencers?.unit_price ?? 0) * 10).toLocaleString()}{t('money.won')}</td>
                <td className="p-3">
                  <QuickSettlementStatusForm
                    id={p.id}
                    status={p.settlement_status ?? 'pending'}
                    settledOn={p.settled_on}
                  />
                </td>
                <td className="p-3">
                  {p.settled_on ? p.settled_on.replaceAll('-', '/') : '-'}
                </td>
                <td className="p-3 space-x-2">
                  <Link href={`/influencers/posts/${p.id}`} className="text-blue-600">{t('common.edit')}</Link>
                  <DeleteButton id={p.id} />
                </td>
              </tr>
            ))}
            {!posts?.length && (
              <tr><td colSpan={8} className="p-8 text-center text-gray-400">{t('posts.none')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
