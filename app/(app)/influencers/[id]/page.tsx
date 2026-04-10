import InfluencerForm from '@/components/InfluencerForm';
import { updateInfluencerAction } from '@/actions/influencers';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function EditInfluencerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data } = await sb.from('influencers').select('*').eq('id', Number(id)).single();
  if (!data) notFound();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">인플루언서 수정</h1>
      <InfluencerForm influencer={data} action={updateInfluencerAction} />
    </div>
  );
}