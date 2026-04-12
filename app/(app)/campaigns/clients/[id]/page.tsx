import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { clientStatusLabel } from '@/lib/labels';
import { deleteClientAction } from '@/actions/clients';
import DeleteButton from '@/components/client/DeleteButton';

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: c } = await sb.from('clients').select('*').eq('id', Number(id)).single();
  if (!c) notFound();

  const fullAddress = [c.region, c.district, c.road_address, c.building_detail].filter(Boolean).join(' ');

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">{c.company_name}</h1>

      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-sm font-semibold border-b border-gray-300 pb-1">기본 정보</h2>
        <Row label="업체명" value={c.company_name} />
        <Row label="담당자" value={c.contact_person ?? '-'} />
        <Row label="연락처" value={c.phone ?? '-'} />
        <Row label="이메일" value={c.email ?? '-'} />
        <Row label="상태" value={clientStatusLabel(c.status)} />
        <Row label="계약기간" value={`${c.contract_start ?? '-'} ~ ${c.contract_end ?? '-'}`} />
        <Row label="계약금액" value={c.contract_amount != null ? c.contract_amount.toLocaleString() + '원' : '-'} />
        <Row label="비고" value={c.memo ?? '-'} />
      </section>

      <section className="bg-white rounded-lg shadow p-6 space-y-3">
        <h2 className="text-sm font-semibold border-b border-gray-300 pb-1">주소</h2>
        <Row label="우편번호" value={c.postal_code ?? '-'} />
        <Row label="주소" value={fullAddress || '-'} />
      </section>

      <div className="flex gap-3">
        <Link href={`/campaigns/clients/${c.id}/edit`}
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">수정</Link>
        <BackButton />
        <div className="ml-auto">
          <DeleteButton id={c.id} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <div className="text-xs text-gray-500 sm:w-24 sm:flex-shrink-0">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}