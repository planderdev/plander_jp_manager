import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import DeleteButton from '@/components/post/DeleteButton';
import { autoCreatePostsFromPastSchedules } from '@/actions/posts';
import { getI18n } from '@/lib/i18n/server';

export default async function PostsPage() {
  const { t } = await getI18n();
  await autoCreatePostsFromPastSchedules();

  const sb = await createClient();
  const { data: posts } = await sb
    .from('posts')
    .select('*, clients(company_name), influencers(handle)')
    .order('settlement_status', { ascending: true })  // pending 먼저, done 뒤
    .order('updated_at', { ascending: false });
    
  const sortedPosts = (posts ?? []).sort((a: any, b: any) => {
    const aDone = a.settlement_status === 'done' ? 1 : 0;
    const bDone = b.settlement_status === 'done' ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

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
              <th className="p-3">{t('common.companyName')}</th>
              <th className="p-3">{t('common.influencer')}</th>
              <th className="p-3">{t('common.post')}</th>
              <th className="p-3">{t('common.uploadDate')}</th>
              <th className="p-3">{t('postForm.settlementStatus')}</th>
              <th className="p-3">{t('postForm.settledOn')}</th>
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
                <td className="p-3">
                  <span className={p.settlement_status === 'done' ? 'text-green-600' : 'text-orange-500'}>
                    {p.settlement_status === 'done' ? t('postForm.done') : t('postForm.pending')}
                  </span>
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
