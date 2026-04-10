import { createClient } from '@/lib/supabase/server';
import ScheduleView from '@/components/schedule/ScheduleView';
import ScheduleForm from '@/components/schedule/ScheduleForm';

export default async function SchedulesPage() {
  const sb = await createClient();

  const [{ data: schedules }, { data: influencers }, { data: clients }] = await Promise.all([
    sb.from('schedules')
      .select('*, clients(company_name), influencers(handle, account_url)')
      .order('scheduled_at', { ascending: true }),
    sb.from('influencers').select('id, handle').order('handle'),
    sb.from('clients').select('id, company_name').order('company_name'),
  ]);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">스케줄 관리</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">신규 등록</h2>
        <ScheduleForm influencers={influencers ?? []} clients={clients ?? []} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">전체 스케줄</h2>
        <ScheduleView schedules={(schedules ?? []) as any} />
      </section>
    </div>
  );
}