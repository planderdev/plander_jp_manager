import { createClient } from '@/lib/supabase/server';
import ScheduleForm from '@/components/schedule/ScheduleForm';
import { notFound } from 'next/navigation';
import DeleteButton from '@/components/schedule/DeleteButton';



export default async function EditSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();

  const [{ data: schedule }, { data: influencers }, { data: clients }] = await Promise.all([
    sb.from('schedules').select('*').eq('id', Number(id)).single(),
    sb.from('influencers').select('id, handle').order('handle'),
    sb.from('clients').select('id, company_name').order('company_name'),
  ]);

  if (!schedule) notFound();

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">스케줄 수정</h1>
      <ScheduleForm
        influencers={influencers ?? []}
        clients={clients ?? []}
        schedule={schedule}
      />
      <div className="ml-auto">
  <DeleteButton id={schedule.id} />
</div>
    </div>
  );
}