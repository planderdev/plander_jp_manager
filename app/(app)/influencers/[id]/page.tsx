import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { fullKR } from '@/lib/datetime';
import { contactStatusLabel } from '@/lib/labels';
import ChannelIcon from '@/components/ChannelIcon';
import { getScheduleStatus, statusLabel, statusColor } from '@/lib/schedule-status';
import MoneyText from '@/components/MoneyText';

export default async function InfluencerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: i } = await sb.from('influencers').select('*').eq('id', Number(id)).single();
  if (!i) notFound();

  // 이 인플루언서의 스케줄도 같이
  const { data: schedules } = await sb.from('schedules')
    .select('*, clients(company_name), posts(post_url, settlement_status)')
    .eq('influencer_id', Number(id))
    .order('scheduled_at', { ascending: false });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">@{i.handle}</h1>

      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-sm font-semibold border-b border-gray-300 pb-1">기본 정보</h2>
        <Row label="채널" value={<ChannelIcon channel={i.channel} size={22} />} />
        <Row label="아이디" value={`@${i.handle}`} />
        <Row label="팔로워" value={`${i.followers?.toLocaleString() ?? 0}명`} />
        <Row label="단가" value={<MoneyText value={i.unit_price} suffix=" JPY" />} />
        <Row label="계정 링크" value={
          i.account_url
            ? <a href={i.account_url} target="_blank" className="inline-block bg-blue-50 border border-blue-300 rounded px-3 py-1 text-blue-700 hover:bg-blue-100">계정 열기 ↗</a>
            : '-'
        } />
        <Row label="비고" value={i.memo ?? '-'} />
        <Row label="연락 상태" value={contactStatusLabel(i.contact_status)} />
      </section>

      <section className="bg-white rounded-lg shadow p-6 space-y-3">
        <h2 className="text-sm font-semibold border-b border-gray-300 pb-1">정산 정보</h2>
        <Row label="이름(EN)" value={i.name_en ?? '-'} />
        <Row label="은행 / 지점" value={[i.bank_name, i.branch_name].filter(Boolean).join(' / ') || '-'} />
        <Row label="계좌번호" value={i.account_number ?? '-'} />
        <Row label="휴대폰" value={i.phone ?? '-'} />
        <Row label="주소" value={[i.postal_code, i.prefecture, i.city, i.street].filter(Boolean).join(' ') || '-'} />
      </section>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-sm font-semibold border-b border-gray-300 pb-2 mb-3">스케줄 이력</h2>
        {schedules?.length ? (
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr><th className="pb-2">일시</th><th className="pb-2">업체</th><th className="pb-2">상태</th></tr>
            </thead>
            <tbody>
              {schedules.map((s: any) => {
                const st = getScheduleStatus(s.scheduled_at, s.posts);
                return (
                  <tr key={s.id} className="border-t">
                    <td className="py-2">{fullKR(s.scheduled_at)}</td>
                    <td className="py-2">{s.clients?.company_name}</td>
                    <td className="py-2">
                      <span className={statusColor(st)}>{statusLabel(st)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <p className="text-gray-400 text-sm">스케줄 없음</p>}
      </section>

      <div className="flex gap-3">
        <Link href={`/influencers/${i.id}/edit`}
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">수정</Link>
        <BackButton />
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