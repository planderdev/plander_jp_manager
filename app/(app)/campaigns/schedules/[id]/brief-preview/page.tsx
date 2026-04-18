import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBriefScheduleData } from '@/lib/briefing';
import { getI18n } from '@/lib/i18n/server';

export default async function BriefPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getI18n();
  const brief = await getBriefScheduleData(Number(id));

  if (!brief) notFound();

  const inviteSrc = `/campaigns/schedules/${brief.id}/brief-preview/invitation.png`;
  const guideSrc = `/campaigns/schedules/${brief.id}/brief-preview/guide.png`;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">초대장 / 가이드 미리보기</h1>
          <p className="text-sm text-gray-500 mt-1">
            @{brief.influencerHandle} · {brief.clientName}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/campaigns/schedules/${brief.id}`} className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50">
            {t('common.back')}
          </Link>
          <a href={inviteSrc} target="_blank" className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800">
            초대장 열기
          </a>
          <a href={guideSrc} target="_blank" className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800">
            가이드 열기
          </a>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">초대장</h2>
          <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-[#120c11]">
            <img src={inviteSrc} alt="Invitation Preview" className="w-full h-auto" />
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">가이드</h2>
          <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white">
            <img src={guideSrc} alt="Guide Preview" className="w-full h-auto" />
          </div>
        </section>
      </div>
    </div>
  );
}
