import { createClient } from '@/lib/supabase/server';
import ScheduleForm from '@/components/schedule/ScheduleForm';
import { notFound } from 'next/navigation';
import { getI18n } from '@/lib/i18n/server';
import Link from 'next/link';
import { sendBriefingEmailAction, sendBriefingLineAction } from '@/actions/briefings';
import FormActionButton from '@/components/FormActionButton';

export default async function EditSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ sent?: string; email_error?: string; line_sent?: string; line_error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { t } = await getI18n();
  const sb = await createClient();

  const [{ data: schedule }, { data: influencers }, { data: clients }] = await Promise.all([
    sb.from('schedules').select('*').eq('id', Number(id)).single(),
    sb.from('influencers').select('id, handle').order('handle'),
    sb.from('clients')
      .select('id, company_name, store_name_ja, postal_code, region, district, road_address, building_detail, address_ja, business_hours, provided_menu')
      .order('company_name'),
  ]);

  if (!schedule) notFound();

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{t('schedule.editTitle')}</h1>
          {query?.sent === '1' ? (
            <p className="mt-2 text-sm text-emerald-600">이메일 전송이 완료되었습니다.</p>
          ) : null}
          {query?.email_error ? (
            <p className="mt-2 text-sm text-red-600">{decodeURIComponent(query.email_error)}</p>
          ) : null}
          {query?.line_sent === '1' ? (
            <p className="mt-2 text-sm text-emerald-600">LINE 전송이 완료되었습니다.</p>
          ) : null}
          {query?.line_error ? (
            <p className="mt-2 text-sm text-red-600">{decodeURIComponent(query.line_error)}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={sendBriefingEmailAction}>
            <input type="hidden" name="schedule_id" value={id} />
            <input type="hidden" name="return_to" value={`/campaigns/schedules/${id}`} />
            <FormActionButton className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300" pendingText="작업중...">
              이메일 바로 전송
            </FormActionButton>
          </form>
          <form action={sendBriefingLineAction}>
            <input type="hidden" name="schedule_id" value={id} />
            <input type="hidden" name="return_to" value={`/campaigns/schedules/${id}`} />
            <FormActionButton className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:bg-emerald-300" pendingText="작업중...">
              LINE 바로 전송
            </FormActionButton>
          </form>
          <Link
            href={`/campaigns/schedules/${id}/brief-preview`}
            className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            초대장/가이드 미리보기
          </Link>
        </div>
      </div>
      <ScheduleForm
        influencers={influencers ?? []}
        clients={clients ?? []}
        schedule={schedule}
      />
    </div>
  );
}
