import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { deleteClientAction } from '@/actions/clients';
import { clientStatusLabel } from '@/lib/labels';

export default async function ClientsPage() {
  const sb = await createClient();
  const { data: clients } = await sb
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">클라이언트 정보</h1>
        <Link href="/campaigns/clients/new" className="bg-black text-white px-4 py-2 rounded">+ 신규 등록</Link>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">업체명</th>
              <th className="p-3">담당자</th>
              <th className="p-3">연락처</th>
              <th className="p-3">상태</th>
              <th className="p-3">계약기간</th>
              <th className="p-3">계약금액</th>
              <th className="p-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {clients?.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.company_name}</td>
                <td className="p-3">{c.contact_person ?? '-'}</td>
                <td className="p-3">{c.phone ?? '-'}</td>
                <td className="p-3">{clientStatusLabel(c.status)}</td>
                <td className="p-3">{c.contract_start ?? '-'} ~ {c.contract_end ?? '-'}</td>
                <td className="p-3">{c.contract_amount?.toLocaleString() ?? '-'}</td>
                <td className="p-3 space-x-2">
                  <Link href={`/campaigns/clients/${c.id}`} className="text-blue-600">수정</Link>
                  <form action={async () => { 'use server'; await deleteClientAction(c.id); }} className="inline">
                    <button className="text-red-500">삭제</button>
                  </form>
                </td>
              </tr>
            ))}
            {!clients?.length && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">등록된 클라이언트가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}