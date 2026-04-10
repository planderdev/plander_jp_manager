import { createClient } from '@/lib/supabase/server';
import PostForm from '@/components/post/PostForm';
import { notFound } from 'next/navigation';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const [{ data: post }, { data: influencers }, { data: clients }] = await Promise.all([
    sb.from('posts').select('*').eq('id', Number(id)).single(),
    sb.from('influencers').select('id, handle, account_url, unit_price, name_en, bank_name, branch_name, account_number, phone, prefecture, city, street').order('handle'),
    sb.from('clients').select('id, company_name').order('company_name'),
  ]);
  if (!post) notFound();

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">게시물 수정</h1>
      <PostForm influencers={influencers ?? []} clients={clients ?? []} post={post} />
    </div>
  );
}