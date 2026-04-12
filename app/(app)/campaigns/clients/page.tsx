import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { clientStatusLabel } from '@/lib/labels';

export default async function ClientsPage() {
  const sb = await createClient();
  const { data: clients } = await sb
    .from('clients')
    .select('*')
    .in('status', ['active', 'paused', 'ended'])
    .order('created_at', { ascending: false });

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">클라이언트 정보</h1>
        <div className="text-xs text-gray-500">
          계약 전 단계는 <Link href="/sales" className="text-blue-600 hover:underline">영업 관리</Link>에서 확인
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">업체명</th>
              <th className="p-3">담당자</th>
              <th className="p-3">연락처</th>
              <th className="p-3">상태</th>
              <th className="p-3">계약기간</th>
              <th className="p-3">계약금액</th>
            </tr>
          </thead>
          <tbody>
            {clients?.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">
                  <Link href={`/campaigns/clients/${c.id}`} className="text-blue-600 hover:underline">
                    {c.company_name}
                  </Link>
                </td>
                <td className="p-3">{c.contact_person ?? '-'}</td>
                <td className="p-3">{c.phone ?? '-'}</td>
                <td className="p-3">{clientStatusLabel(c.status)}</td>
                <td className="p-3">{c.contract_start ?? '-'} ~ {c.contract_end ?? '-'}</td>
                <td className="p-3">{c.contract_amount?.toLocaleString() ?? '-'}</td>
              </tr>
            ))}
            {!clients?.length && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">등록된 클라이언트가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}