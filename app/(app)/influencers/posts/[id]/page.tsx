import { createClient } from '@/lib/supabase/server';
import PostForm from '@/components/post/PostForm';
import { notFound } from 'next/navigation';
import { getI18n } from '@/lib/i18n/server';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getI18n();
  const sb = await createClient();
  const [{ data: post }, { data: influencers }, { data: clients }, { data: schedules }, { data: linkedPosts }] = await Promise.all([
    sb.from('posts').select('*').eq('id', Number(id)).single(),
    sb.from('influencers').select('id, handle, account_url, unit_price, name_en, bank_name, branch_name, account_number, phone, prefecture, city, street').order('handle'),
    sb.from('clients').select('id, company_name').order('company_name'),
    sb.from('schedules').select('id, scheduled_at, client_id, influencer_id').order('scheduled_at', { ascending: false }),
    sb.from('posts').select('schedule_id, id').not('schedule_id', 'is', null),
  ]);
  if (!post) notFound();
  
  const usedScheduleIds = new Set(
    (linkedPosts ?? []).filter((p: any) => p.id !== post.id).map((p: any) => p.schedule_id)
  );
  const availableSchedules = (schedules ?? []).filter((s: any) => !usedScheduleIds.has(s.id));

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">{t('post.editTitle')}</h1>
      <PostForm
        influencers={influencers ?? []}
        clients={clients ?? []}
        post={post}
        schedules={availableSchedules}
      />
    </div>
  );
}
