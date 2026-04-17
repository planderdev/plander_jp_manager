import InfluencerForm from '@/components/InfluencerForm';
import { createInfluencerAction } from '@/actions/influencers';
import { getI18n } from '@/lib/i18n/server';

export default async function NewInfluencerPage() {
  const { t } = await getI18n();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">{t('influencer.newTitle')}</h1>
      <InfluencerForm action={createInfluencerAction} />
    </div>
  );
}
