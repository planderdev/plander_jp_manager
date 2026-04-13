import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { shortKR } from '@/lib/datetime';
import { clientStatusLabel } from '@/lib/labels';
import { getScheduleStatus } from '@/lib/schedule-status';
import { autoCreatePostsFromPastSchedules } from '@/actions/posts';

export default async function DashboardPage() {
  await autoCreatePostsFromPastSchedules();
  
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

  // 상태별 카운트
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
    { label: '총 클라이언트', value: clientCount ?? 0, href: '/campaigns/clients', color: 'bg-purple-600' },
    { label: '총 인플루언서', value: influencerCount ?? 0, href: '/influencers', color: 'bg-green-600' },
    { label: '방문예정', value: reserved, href: '/campaigns/schedules', color: 'bg-orange-500' },
    { label: '업로드 대기', value: uploadPending, href: '/influencers/posts', color: 'bg-red-500' },
    { label: '정산 대기', value: settlementPending, href: '/influencers/posts', color: 'bg-red-500' },
    { label: '완료', value: done, href: '/campaigns/completed', color: 'bg-green-600' },
  ];

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>

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
            업로드 대기 (최대 10건) →
          </Link>
          {uploadPendingList.length === 0 ? (
            <p className="text-gray-400 text-sm">없음</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr><th className="p-2">촬영일</th><th className="p-2">인플루언서</th><th className="p-2">업체명</th></tr>
                </thead>
                <tbody>
                  {uploadPendingList.slice(0, 10).map((s: any) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-2">{shortKR(s.scheduled_at)}</td>
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
            정산 대기 (최대 10건) →
          </Link>
          {settlementPendingList.length === 0 ? (
            <p className="text-gray-400 text-sm">없음</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr><th className="p-2">촬영일</th><th className="p-2">인플루언서</th><th className="p-2">업체명</th></tr>
                </thead>
                <tbody>
                  {settlementPendingList.slice(0, 10).map((s: any) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-2">{shortKR(s.scheduled_at)}</td>
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
        <h2 className="text-lg font-semibold mb-4">클라이언트 목록</h2>
        {(clients ?? []).length === 0 ? (
          <p className="text-gray-400 text-sm">등록된 클라이언트가 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2">업체명</th>
                  <th className="p-2">담당자</th>
                  <th className="p-2">연락처</th>
                  <th className="p-2">상태</th>
                  <th className="p-2">계약기간</th>
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
                    <td className="p-2">{clientStatusLabel(c.status)}</td>
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