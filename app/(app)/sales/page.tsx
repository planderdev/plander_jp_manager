import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { clientStatusLabel, clientStatusClass, isInactiveClient, isActivePipeline } from '@/lib/labels';

export default async function SalesPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; category?: string; region?: string; owner?: string; q?: string }> }) {
  const { status, category, region, owner, q } = await searchParams;
  const sb = await createClient();

  // 클라이언트 전체 + 담당자 조인 + 필터
  let query = sb.from('clients')
    .select('*, owner:admins!clients_owner_id_fkey(id, name)')
    .order('first_contact_date', { ascending: false, nullsFirst: false });

  if (status && status !== 'active_pipeline') {
    query = query.eq('status', status);
  }
  if (category) query = query.eq('category', category);
  if (region) query = query.eq('sales_region', region);
  if (owner) query = query.eq('owner_id', owner);
  if (q) query = query.ilike('company_name', `%${q}%`);

  const { data: clientsRaw } = await query;
  let clients = clientsRaw ?? [];

  // 기본값: 활성 파이프라인만
  if (!status) {
    clients = clients.filter(c => isActivePipeline(c.status));
  } else if (status === 'active_pipeline') {
    clients = clients.filter(c => isActivePipeline(c.status));
  }

  // 필터 옵션용 데이터
  const [{ data: admins }, { data: options }] = await Promise.all([
    sb.from('admins').select('id, name').order('name'),
    sb.from('client_options').select('*').order('value'),
  ]);
  const categoryOptions = (options ?? []).filter(o => o.kind === 'category');
  const regionOptions = (options ?? []).filter(o => o.kind === 'sales_region');

  // 상태별 카운트 (전체 기준, 필터 무관)
  const { data: allForCount } = await sb.from('clients').select('status');
  const counts: Record<string, number> = {};
  for (const c of allForCount ?? []) counts[c.status] = (counts[c.status] ?? 0) + 1;

  const summaryCards = [
    { label: '접촉완료', key: 'contacted', color: 'bg-blue-500' },
    { label: '제안/미팅', key: 'proposed', color: 'bg-purple-500' },
    { label: '협상중', key: 'negotiating', color: 'bg-amber-500' },
    { label: '진행중', key: 'active', color: 'bg-red-500' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">영업 관리</h1>
        <Link href="/campaigns/clients/new" className="bg-black text-white px-4 py-2 rounded">
          + 신규 등록
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <Link key={c.key} href={`/sales?status=${c.key}`}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
            <div className={`inline-block w-2 h-2 rounded-full ${c.color} mb-1`}></div>
            <div className="text-xs text-gray-600">{c.label}</div>
            <div className="text-2xl font-bold">{counts[c.key] ?? 0}</div>
          </Link>
        ))}
      </div>

      {/* 필터 */}
      <form className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm block mb-1 font-medium">상태</label>
          <select name="status" defaultValue={status ?? ''} className="border border-gray-400 rounded p-2 text-sm">
            <option value="">진행 중인 영업만</option>
            <option value="contacted">접촉완료</option>
            <option value="proposed">제안/미팅</option>
            <option value="negotiating">협상중</option>
            <option value="active">진행중</option>
            <option value="paused">보류</option>
            <option value="ended">종료</option>
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">카테고리</label>
          <select name="category" defaultValue={category ?? ''} className="border border-gray-400 rounded p-2 text-sm">
            <option value="">전체</option>
            {categoryOptions.map((o) => (
              <option key={o.id} value={o.value}>{o.value}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">지역</label>
          <select name="region" defaultValue={region ?? ''} className="border border-gray-400 rounded p-2 text-sm">
            <option value="">전체</option>
            {regionOptions.map((o) => (
              <option key={o.id} value={o.value}>{o.value}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">담당자</label>
          <select name="owner" defaultValue={owner ?? ''} className="border border-gray-400 rounded p-2 text-sm">
            <option value="">전체</option>
            {admins?.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-sm block mb-1 font-medium">업체명 검색</label>
          <input type="text" name="q" defaultValue={q ?? ''} placeholder="검색..."
            className="border border-gray-400 rounded p-2 text-sm w-full" />
        </div>
        <button className="bg-black text-white px-4 py-2 rounded text-sm">조회</button>
      </form>

      {/* 리스트 */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">업체명</th>
              <th className="p-3">카테고리</th>
              <th className="p-3">지역</th>
              <th className="p-3">담당자(업체)</th>
              <th className="p-3">연락처</th>
              <th className="p-3">최초접촉</th>
              <th className="p-3">상태</th>
              <th className="p-3">계약금액</th>
              <th className="p-3">계약일</th>
              <th className="p-3">담당</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c: any) => {
              const inactive = isInactiveClient(c.status);
              return (
                <tr key={c.id} className={`border-t ${inactive ? 'bg-gray-50 text-gray-400' : ''}`}>
                  <td className="p-3 font-medium">
                    <Link href={`/campaigns/clients/${c.id}`}
                      className={inactive ? 'hover:underline' : 'text-blue-600 hover:underline'}>
                      {c.company_name}
                    </Link>
                  </td>
                  <td className="p-3">{c.category ?? '-'}</td>
                  <td className="p-3">{c.sales_region ?? '-'}</td>
                  <td className="p-3">{c.contact_person ?? '-'}</td>
                  <td className="p-3">{c.phone ?? '-'}</td>
                  <td className="p-3">{c.first_contact_date ?? '-'}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${clientStatusClass(c.status)}`}>
                      {clientStatusLabel(c.status)}
                    </span>
                  </td>
                  <td className="p-3">{c.contract_amount?.toLocaleString() ?? '-'}</td>
                  <td className="p-3">{c.contract_start ?? '-'}</td>
                  <td className="p-3">{c.owner?.name ?? '-'}</td>
                </tr>
              );
            })}
            {!clients.length && (
              <tr><td colSpan={10} className="p-8 text-center text-gray-400">조회된 항목이 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}