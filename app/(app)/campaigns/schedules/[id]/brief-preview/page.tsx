import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBriefScheduleData } from '@/lib/briefing';
import { getI18n } from '@/lib/i18n/server';
import { sendBriefingEmailAction, sendBriefingLineAction } from '@/actions/briefings';
import FormActionButton from '@/components/FormActionButton';

export default async function BriefPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ refresh?: string; sent?: string; email_error?: string; line_sent?: string; line_error?: string }>;
}) {
  const { id } = await params;
  const { t } = await getI18n();
  const query = await searchParams;
  const brief = await getBriefScheduleData(Number(id));

  if (!brief) notFound();

  const cacheKey = query?.refresh ? `?v=${encodeURIComponent(query.refresh)}` : '';
  const inviteSrc = `/campaigns/schedules/${brief.id}/brief-preview/invitation.png${cacheKey}`;
  const guideSrc = `/campaigns/schedules/${brief.id}/brief-preview/guide.png${cacheKey}`;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">초대장 / 가이드 미리보기</h1>
          <p className="text-sm text-gray-500 mt-1">
            @{brief.influencerHandle} · {brief.clientName}
          </p>
          {query?.sent === '1' ? (
            <p className="text-sm text-emerald-600 mt-2">고정 메일 주소로 전송했습니다.</p>
          ) : null}
          {query?.email_error ? (
            <p className="text-sm text-red-600 mt-2">{decodeURIComponent(query.email_error)}</p>
          ) : null}
          {query?.line_sent === '1' ? (
            <p className="text-sm text-emerald-600 mt-2">LINE으로 전송했습니다.</p>
          ) : null}
          {query?.line_error ? (
            <p className="text-sm text-red-600 mt-2">{decodeURIComponent(query.line_error)}</p>
          ) : null}
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
          <Link
            href={`/campaigns/schedules/${brief.id}/brief-preview?refresh=${Date.now()}`}
            className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50"
          >
            재생성
          </Link>
          <form action={sendBriefingEmailAction}>
            <input type="hidden" name="schedule_id" value={brief.id} />
            <input type="hidden" name="return_to" value={`/campaigns/schedules/${brief.id}/brief-preview?refresh=${Date.now()}`} />
            <FormActionButton className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300" pendingText="작업중...">
              메일 테스트 전송
            </FormActionButton>
          </form>
          <form action={sendBriefingLineAction}>
            <input type="hidden" name="schedule_id" value={brief.id} />
            <input type="hidden" name="return_to" value={`/campaigns/schedules/${brief.id}/brief-preview?refresh=${Date.now()}`} />
            <FormActionButton className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300" pendingText="작업중...">
              LINE 바로 전송
            </FormActionButton>
          </form>
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
