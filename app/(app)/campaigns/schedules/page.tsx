import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ScheduleView from '@/components/schedule/ScheduleView';
import { getI18n } from '@/lib/i18n/server';

export default async function SchedulesPage() {
  const { t } = await getI18n();
  const sb = await createClient();

  const { data: schedules } = await sb.from('schedules')
    .select('*, clients(company_name), influencers(handle, account_url)')
    .order('scheduled_at', { ascending: false });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.scheduleManagement')}</h1>
        <Link href="/campaigns/schedules/new"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
          {t('common.create')}
        </Link>
      </div>

      <ScheduleView schedules={(schedules ?? []) as any} />
    </div>
  );
}
