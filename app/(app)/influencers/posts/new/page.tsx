import { createClient } from '@/lib/supabase/server';
import PostForm from '@/components/post/PostForm';

export default async function NewPostPage() {
  const sb = await createClient();
  const [{ data: influencers }, { data: clients }, { data: schedules }, { data: linkedPosts }] = await Promise.all([
    sb.from('influencers').select('id, handle, account_url, unit_price, name_en, bank_name, branch_name, account_number, phone, prefecture, city, street').order('handle'),
    sb.from('clients').select('id, company_name').order('company_name'),
    sb.from('schedules').select('id, scheduled_at, client_id, influencer_id').order('scheduled_at', { ascending: false }),
    sb.from('posts').select('schedule_id').not('schedule_id', 'is', null),
  ]);

  // 이미 다른 게시물에 연결된 schedule_id 제외
  const usedScheduleIds = new Set((linkedPosts ?? []).map((p: any) => p.schedule_id));
  const availableSchedules = (schedules ?? []).filter((s: any) => !usedScheduleIds.has(s.id));

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">게시물 신규 등록</h1>
      <PostForm
        influencers={influencers ?? []}
        clients={clients ?? []}
        schedules={availableSchedules}
      />
    </div>
  );
}