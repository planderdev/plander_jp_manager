import InfluencerForm from '@/components/InfluencerForm';
import { createInfluencerAction } from '@/actions/influencers';

export default function NewInfluencerPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">인플루언서 신규 등록</h1>
      <InfluencerForm action={createInfluencerAction} />
    </div>
  );
}