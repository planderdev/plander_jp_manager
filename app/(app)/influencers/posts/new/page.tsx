import { createClient } from '@/lib/supabase/server';
import PostForm from '@/components/post/PostForm';

export default async function NewPostPage() {
  const sb = await createClient();
  const [{ data: influencers }, { data: clients }] = await Promise.all([
    sb.from('influencers').select('id, handle, account_url, unit_price, name_en, bank_name, branch_name, account_number, phone, prefecture, city, street').order('handle'),
    sb.from('clients').select('id, company_name').order('company_name'),
  ]);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">게시물 신규 등록</h1>
      <PostForm influencers={influencers ?? []} clients={clients ?? []} />
    </div>
  );
}