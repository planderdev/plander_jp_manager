import InfluencerForm from '@/components/InfluencerForm';
import { createInfluencerAction } from '@/actions/influencers';
import { DEFAULT_INFLUENCER_MEDIA_CONFIG } from '@/lib/briefing-config';
import { getI18n } from '@/lib/i18n/server';

export default async function NewInfluencerPage() {
  const { t } = await getI18n();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">{t('influencer.newTitle')}</h1>
      <InfluencerForm
        action={createInfluencerAction}
        profileScreenshotUrl={DEFAULT_INFLUENCER_MEDIA_CONFIG.profileScreenshotPath}
      />
    </div>
  );
}
