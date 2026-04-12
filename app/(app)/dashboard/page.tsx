import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { shortKR } from '@/lib/datetime';
import { clientStatusLabel } from '@/lib/labels';

export default async function DashboardPage() {
  const sb = await createClient();
  const now = new Date().toISOString();

  const [
    { count: pendingCount },
    { count: upcomingCount },
    { count: influencerCount },
    { data: pastSchedules },
    { data: completedPosts },
  ] = await Promise.all([
    sb.from('clients').select('id, company_name, contact_person, phone, status, contract_start, contract_end')
      .order('company_name'),
    sb.from('posts').select('id', { count: 'exact', head: true })
      .eq('settlement_status', 'pending').not('post_url', 'is', null),
    sb.from('schedules').select('id', { count: 'exact', head: true })
      .gte('scheduled_at', now),
    sb.from('influencers').select('id', { count: 'exact', head: true }),
    sb.from('schedules')
      .select('*, clients(company_name), influencers(handle)')
      .lt('scheduled_at', now)
      .order('scheduled_at', { ascending: true }),
    sb.from('posts')
      .select('client_id, influencer_id, schedule_id, post_url')
      .not('post_url', 'is', null),
      
  ]);

  const completedScheduleIds = new Set<number>();
  const completedPairs = new Set<string>();
  for (const p of completedPosts ?? []) {
    if (p.schedule_id) completedScheduleIds.add(p.schedule_id);
    completedPairs.add(`${p.client_id}-${p.influencer_id}`);
  }

  const waiting = (pastSchedules ?? []).filter((s: any) => {
    if (completedScheduleIds.has(s.id)) return false;
    if (completedPairs.has(`${s.client_id}-${s.influencer_id}`)) return false;
    return true;
  }).slice(0, 10);

  const cards = [
    { label: '정산 대기', value: pendingCount ?? 0, href: '/influencers/posts', color: 'bg-orange-500' },
    { label: '방문 예정', value: upcomingCount ?? 0, href: '/campaigns/schedules', color: 'bg-blue-500' },
    { label: '업로드 대기', value: waiting.length, href: '/campaigns/schedules', color: 'bg-red-500' },
    { label: '총 인플루언서', value: influencerCount ?? 0, href: '/influencers', color: 'bg-green-600' },
  ];

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}
            className="bg-white rounded-lg shadow p-5 hover:shadow-md transition">
            <div className={`inline-block w-2 h-2 rounded-full ${c.color} mb-2`}></div>
            <div className="text-sm text-gray-600">{c.label}</div>
            <div className="text-3xl font-bold mt-1">{c.value.toLocaleString()}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-lg font-semibold mb-4">업로드 대기 (최대 10건)</h2>
        {waiting.length === 0 ? (
          <p className="text-gray-400 text-sm">대기중인 항목이 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2">촬영일</th>
                  <th className="p-2">인플루언서</th>
                  <th className="p-2">업체명</th>
                </tr>
              </thead>
              <tbody>
                {waiting.map((s: any) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2">{shortKR(s.scheduled_at)}</td>
                    <td className="p-2">
                      <Link href={`/influencers/${s.influencer_id}`} className="text-blue-600 hover:underline">
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
      <div className="bg-white rounded-lg shadow p-5 mt-6">
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