import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import DeleteButton from '@/components/post/DeleteButton';
import { autoCreatePostsFromPastSchedules } from '@/actions/posts';

export default async function PostsPage() {
  await autoCreatePostsFromPastSchedules();  // ← 페이지 진입 시 자동 변환

  const sb = await createClient();
  const { data: posts } = await sb
    .from('posts')
    .select('*, clients(company_name), influencers(handle)')
    .order('updated_at', { ascending: false });

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">게시물 / 정산관리</h1>
        <div className="flex gap-2">
          <Link href="/influencers/posts/metrics"
            className="border border-gray-400 px-4 py-2 rounded text-sm hover:bg-gray-100">
            월별 메트릭 입력
          </Link>
          <Link href="/influencers/posts/new" className="bg-black text-white px-4 py-2 rounded">+ 신규 등록</Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">업체명</th>
              <th className="p-3">인플루언서</th>
              <th className="p-3">게시물</th>
              <th className="p-3">업로드일</th>
              <th className="p-3">정산</th>
              <th className="p-3">정산일</th>
              <th className="p-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {posts?.map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.clients?.company_name ?? '-'}</td>
                <td className="p-3">
                  <Link href={`/influencers/${p.influencer_id}`} className="text-blue-600 hover:underline">
                    @{p.influencers?.handle}
                  </Link>
                </td>
                <td className="p-3">
                  {p.post_url
                    ? <a href={p.post_url} target="_blank" className="text-blue-600 hover:underline">링크</a>
                    : <span className="text-gray-400">미업로드</span>}
                </td>
                <td className="p-3">{p.uploaded_on ?? '-'}</td>
                <td className="p-3">
                  <span className={p.settlement_status === 'done' ? 'text-green-600' : 'text-orange-500'}>
                    {p.settlement_status === 'done' ? '정산완료' : '미정산'}
                  </span>
                </td>
                <td className="p-3">
                  {p.settled_on ? p.settled_on.replaceAll('-', '/') : '-'}
                </td>
                <td className="p-3 space-x-2">
                  <Link href={`/influencers/posts/${p.id}`} className="text-blue-600">수정</Link>
                  <DeleteButton id={p.id} />
                </td>
              </tr>
            ))}
            {!posts?.length && (
              <tr><td colSpan={8} className="p-8 text-center text-gray-400">등록된 게시물이 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}