import { createClient } from '@/lib/supabase/server';
import ScheduleForm from '@/components/schedule/ScheduleForm';
import { notFound } from 'next/navigation';
import { getI18n } from '@/lib/i18n/server';
import Link from 'next/link';

export default async function EditSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
        <h1 className="text-2xl font-bold">{t('schedule.editTitle')}</h1>
        <Link
          href={`/campaigns/schedules/${id}/brief-preview`}
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          초대장/가이드 미리보기
        </Link>
      </div>
      <ScheduleForm
        influencers={influencers ?? []}
        clients={clients ?? []}
        schedule={schedule}
      />
    </div>
  );
}
