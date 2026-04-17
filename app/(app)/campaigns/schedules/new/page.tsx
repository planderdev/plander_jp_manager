import { createClient } from '@/lib/supabase/server';
import ScheduleForm from '@/components/schedule/ScheduleForm';
import { getI18n } from '@/lib/i18n/server';

export default async function NewSchedulePage() {
  const { t } = await getI18n();
  const sb = await createClient();
  const [{ data: influencers }, { data: clients }] = await Promise.all([
    sb.from('influencers').select('id, handle').order('handle'),
    sb.from('clients').select('id, company_name').in('status', ['active', 'paused']).order('company_name'),
  ]);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">{t('schedule.newTitle')}</h1>
      <ScheduleForm influencers={influencers ?? []} clients={clients ?? []} />
    </div>
  );
}
