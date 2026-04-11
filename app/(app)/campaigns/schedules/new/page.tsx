import { createClient } from '@/lib/supabase/server';
import ScheduleForm from '@/components/schedule/ScheduleForm';

export default async function NewSchedulePage() {
  const sb = await createClient();
  const [{ data: influencers }, { data: clients }] = await Promise.all([
    sb.from('influencers').select('id, handle').order('handle'),
    sb.from('clients').select('id, company_name').order('company_name'),
  ]);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">스케줄 신규 등록</h1>
      <ScheduleForm influencers={influencers ?? []} clients={clients ?? []} />
    </div>
  );
}