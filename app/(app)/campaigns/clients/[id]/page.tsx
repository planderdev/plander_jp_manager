import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import BackButton from '@/components/BackButton';
import DeleteButton from '@/components/client/DeleteButton';
import { clientStatusLabel, clientStatusClass } from '@/lib/labels';

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');

  const { data: c } = await sb.from('clients').select('*').eq('id', Number(id)).single();
  if (!c) notFound();

  const { data: ownerAdmin } = c.owner_id
    ? await sb.from('admins').select('name').eq('id', c.owner_id).single()
    : { data: null };

  const canEdit = !c.owner_id || c.owner_id === user.id;
  const fullAddress = [c.region, c.district, c.road_address, c.building_detail].filter(Boolean).join(' ');

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">{c.company_name}</h1>
        <span className={`inline-block px-2 py-1 rounded text-xs ${clientStatusClass(c.status)}`}>
          {clientStatusLabel(c.status)}
        </span>
      </div>

      <section className="bg-white rounded-lg shadow p-6 space-y-3">
        <h2 className="text-sm font-semibold border-b border-gray-300 pb-1">기본 정보</h2>
        <Row label="카테고리" value={c.category ?? '-'} />
        <Row label="지역" value={c.sales_region ?? '-'} />
        <Row label="담당자(업체)" value={c.contact_person ?? '-'} />
        <Row label="연락처" value={c.phone ?? '-'} />
        <Row label="이메일" value={c.email ?? '-'} />
        <Row label="주소" value={`${c.postal_code ? `(${c.postal_code}) ` : ''}${fullAddress || '-'}`} />
      </section>

      <section className="bg-white rounded-lg shadow p-6 space-y-3">
        <h2 className="text-sm font-semibold border-b border-gray-300 pb-1">영업 정보</h2>
        <Row label="최초접촉일" value={c.first_contact_date ?? '-'} />
        <Row label="계약상품" value={c.contract_product ?? '-'} />
        <Row label="계약금액" value={c.contract_amount != null ? c.contract_amount.toLocaleString() + '원' : '-'} />
        <Row label="계약기간" value={`${c.contract_start ?? '-'} ~ ${c.contract_end ?? '-'}`} />
        <Row label="담당자(관리자)" value={ownerAdmin?.name ?? '미지정'} />
      </section>

      {c.memo && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold border-b border-gray-300 pb-1 mb-3">메모</h2>
          <p className="whitespace-pre-wrap">{c.memo}</p>
        </section>
      )}

      <div className="flex gap-3 flex-wrap">
        {canEdit ? (
          <Link href={`/campaigns/clients/${c.id}/edit`}
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">수정</Link>
        ) : (
          <span className="text-sm text-gray-500 self-center">담당자 {ownerAdmin?.name} 만 수정 가능</span>
        )}
        <BackButton />
        {canEdit && (
          <div className="ml-auto">
            <DeleteButton id={c.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <div className="text-xs text-gray-500 sm:w-24 sm:flex-shrink-0">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}