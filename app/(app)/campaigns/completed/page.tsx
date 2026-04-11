import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function CompletedPage({
  searchParams,
}: { searchParams: Promise<{ handle?: string; company?: string }> }) {
  const { handle, company } = await searchParams;
  const sb = await createClient();

  let q = sb.from('posts')
    .select('*, clients(company_name), influencers(handle, account_url, unit_price, name_en, bank_name, branch_name, account_number, phone, prefecture, city, street)')
    .not('post_url', 'is', null)
    .order('updated_at', { ascending: false });

  const { data: all } = await q;
  let posts = all ?? [];

  // 클라이언트 사이드 필터 (관계 필터는 조인 필터로 직접 처리)
  if (handle) posts = posts.filter((p: any) => p.influencers?.handle?.toLowerCase().includes(handle.toLowerCase()));
  if (company) posts = posts.filter((p: any) => p.clients?.company_name?.toLowerCase().includes(company.toLowerCase()));

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">완료 게시물 목록</h1>

      <form className="mb-4 flex flex-wrap gap-2">
        <input name="handle" defaultValue={handle ?? ''} placeholder="인플루언서 아이디"
          className="border border-gray-400 rounded p-2 text-sm" />
        <input name="company" defaultValue={company ?? ''} placeholder="업체명"
          className="border border-gray-400 rounded p-2 text-sm" />
        <button className="bg-black text-white px-4 py-2 rounded text-sm">검색</button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">업체명</th>
              <th className="p-3">인플루언서</th>
              <th className="p-3">계정링크</th>
              <th className="p-3">게시물</th>
              <th className="p-3">조회</th>
              <th className="p-3">좋아요</th>
              <th className="p-3">댓글</th>
              <th className="p-3">단가</th>
              <th className="p-3">정산</th>
              <th className="p-3">정산일</th>
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
                    <a href={p.influencers.account_url} target="_blank" className="text-blue-600 hover:underline">링크</a>
                  )}
                </td>
                <td className="p-3">
                  <a href={p.post_url} target="_blank" className="text-blue-600 hover:underline">링크</a>
                </td>
                <td className="p-3">{p.views?.toLocaleString()}</td>
                <td className="p-3">{p.likes?.toLocaleString()}</td>
                <td className="p-3">{p.comments?.toLocaleString()}</td>
                <td className="p-3">{p.influencers?.unit_price != null ? `¥${p.influencers.unit_price.toLocaleString()}` : '-'}</td>
                <td className="p-3">
                  <span className={p.settlement_status === 'done' ? 'text-green-600' : 'text-orange-500'}>
                    {p.settlement_status === 'done' ? '완료' : '미정산'}
                  </span>
                </td>
                <td className="p-3">{p.settled_on?.replaceAll('-', '/') ?? '-'}</td>
              </tr>
            ))}
            {!posts.length && (
              <tr><td colSpan={10} className="p-8 text-center text-gray-400">완료된 게시물이 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}