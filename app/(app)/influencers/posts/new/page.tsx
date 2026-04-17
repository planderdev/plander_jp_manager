import { createClient } from '@/lib/supabase/server';
import PostForm from '@/components/post/PostForm';
import { getI18n } from '@/lib/i18n/server';

export default async function NewPostPage() {
  const { t } = await getI18n();
  const sb = await createClient();
  const [{ data: influencers }, { data: clients }, { data: schedules }, { data: linkedPosts }] = await Promise.all([
    sb.from('influencers').select('id, handle, account_url, unit_price, name_en, bank_name, branch_name, account_number, phone, prefecture, city, street').order('handle'),
    sb.from('clients').select('id, company_name').order('company_name'),
    sb.from('schedules').select('id, scheduled_at, client_id, influencer_id').order('scheduled_at', { ascending: false }),
    sb.from('posts').select('schedule_id').not('schedule_id', 'is', null),
  ]);

  const usedScheduleIds = new Set((linkedPosts ?? []).map((p: any) => p.schedule_id));
  const availableSchedules = (schedules ?? []).filter((s: any) => !usedScheduleIds.has(s.id));

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">{t('posts.new')}</h1>
      <PostForm
        influencers={influencers ?? []}
        clients={clients ?? []}
        schedules={availableSchedules}
      />
    </div>
  );
}
