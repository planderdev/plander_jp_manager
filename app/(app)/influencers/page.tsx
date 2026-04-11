import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { deleteInfluencerAction } from '@/actions/influencers';

export default async function InfluencersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const sb = await createClient();
  let query = sb.from('influencers').select('*').order('created_at', { ascending: false });
  if (q) query = query.ilike('handle', `%${q}%`);
  const { data: list } = await query;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">인플루언서 목록</h1>
        <Link href="/influencers/new" className="bg-black text-white px-4 py-2 rounded">+ 신규 등록</Link>
      </div>

      <form className="mb-4">
        <input name="q" defaultValue={q ?? ''} placeholder="아이디 검색..." className="border rounded p-2 w-64" />
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">채널</th>
              <th className="p-3">아이디</th>
              <th className="p-3">계정</th>
              <th className="p-3">팔로워</th>
              <th className="p-3">단가</th>
              <th className="p-3">연락상태</th>
              <th className="p-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {list?.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="p-3">{i.channel}</td>
                <td className="p-3 font-medium">
                  <Link href={`/influencers/${i.id}`} className="text-blue-600 hover:underline">@{i.handle}</Link>
                </td>
                <td className="p-3">
                  {i.account_url && (
                    <a href={i.account_url} target="_blank" className="text-xs bg-blue-50 border border-blue-300 rounded px-2 py-1 text-blue-700 hover:bg-blue-100">
                      계정 ↗
                    </a>
                  )}
                </td>
                <td className="p-3">{i.followers?.toLocaleString()} 명</td>
                <td className="p-3">{i.unit_price != null ? `JPY ${i.unit_price.toLocaleString()}` : '-'}</td>
                <td className="p-3">{i.contact_status}</td>
                <td className="p-3 space-x-2">
                  <Link href={`/influencers/${i.id}/edit`} className="text-blue-600">수정</Link>
                  <form action={async () => { 'use server'; await deleteInfluencerAction(i.id); }} className="inline">
                    <button className="text-red-500">삭제</button>
                  </form>
                </td>
              </tr>
            ))}
            {!list?.length && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">등록된 인플루언서가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}