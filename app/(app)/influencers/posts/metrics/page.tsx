import Link from 'next/link';
import { getMetricsForMonth, saveMetricsForMonth } from '@/actions/metrics';
import SubmitButton from '@/components/SubmitButton';
import BackButton from '@/components/BackButton';

function defaultMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default async function MetricsPage({
  searchParams,
}: { searchParams: Promise<{ month?: string }> }) {
  const { month: m } = await searchParams;
  const month = m || defaultMonth();
  const { posts, history } = await getMetricsForMonth(month);

  // post_id -> 기존 값 매핑
  const histMap = new Map<number, any>();
  for (const h of history) histMap.set(h.post_id, h);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">월별 메트릭 입력</h1>
        <Link href="/influencers/posts" className="text-sm text-blue-600 hover:underline">
          ← 게시물 목록
        </Link>
      </div>

      {/* 월 선택 */}
      <form className="bg-white rounded-lg shadow p-4 flex items-end gap-3">
        <div>
          <label className="text-sm block mb-1 font-medium">월</label>
          <input type="month" name="month" defaultValue={month}
            className="border border-gray-400 rounded p-2" />
        </div>
        <button className="bg-black text-white px-4 py-2 rounded text-sm">조회수</button>
      </form>

      {posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
          입력 가능한 게시물이 없습니다 (업로드된 + 계약 진행 중인 게시물만)
        </div>
      ) : (
        <form action={saveMetricsForMonth} className="space-y-4">
          <input type="hidden" name="month" value={month} />

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">업로드일</th>
                  <th className="p-3">인플루언서</th>
                  <th className="p-3">업체명</th>
                  <th className="p-3">링크</th>
                  <th className="p-3">조회수수</th>
                  <th className="p-3">좋아요수</th>
                  <th className="p-3">댓글수</th>
                  <th className="p-3">공유수</th>
                  <th className="p-3">최종 입력</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p: any) => {
                  const h = histMap.get(p.id);
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="p-3">{p.uploaded_on ?? '-'}</td>
                      <td className="p-3">@{p.influencers?.handle}</td>
                      <td className="p-3">{p.clients?.company_name}</td>
                      <td className="p-3">
                        <a href={p.post_url} target="_blank"
                          className="inline-block bg-blue-50 border border-blue-300 rounded px-2 py-1 text-xs text-blue-700 hover:bg-blue-100">
                          링크
                        </a>
                      </td>
                      <td className="p-3">
                        <input type="number" name={`views_${p.id}`} defaultValue={h?.views ?? 0}
                          className="border border-gray-400 rounded p-1 w-24 text-right" />
                      </td>
                      <td className="p-3">
                        <input type="number" name={`likes_${p.id}`} defaultValue={h?.likes ?? 0}
                          className="border border-gray-400 rounded p-1 w-24 text-right" />
                      </td>
                      <td className="p-3">
                        <input type="number" name={`comments_${p.id}`} defaultValue={h?.comments ?? 0}
                          className="border border-gray-400 rounded p-1 w-20 text-right" />
                      </td>
                      <td className="p-3">
                        <input type="number" name={`shares_${p.id}`} defaultValue={h?.shares ?? 0}
                          className="border border-gray-400 rounded p-1 w-20 text-right" />
                      </td>
                      <td className="p-3 text-xs text-gray-500">
                        {h?.entered_at ? new Date(h.entered_at).toLocaleDateString('ko-KR') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <SubmitButton>저장</SubmitButton>
            <BackButton />
          </div>
        </form>
      )}
    </div>
  );
}