import InfluencerForm from '@/components/InfluencerForm';
import { updateInfluencerAction } from '@/actions/influencers';
import { getInfluencerMediaConfig } from '@/lib/briefing-config';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getI18n } from '@/lib/i18n/server';

export default async function EditInfluencerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getI18n();
  const sb = await createClient();
  const [{ data }, mediaConfig] = await Promise.all([
    sb.from('influencers').select('*').eq('id', Number(id)).single(),
    getInfluencerMediaConfig(Number(id)),
  ]);
  if (!data) notFound();
  const screenshotUrl = mediaConfig.profileScreenshotPath
    ? (await sb.storage.from('contracts').createSignedUrl(mediaConfig.profileScreenshotPath, 3600)).data?.signedUrl ?? null
    : null;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">{t('influencer.editTitle')}</h1>
      <InfluencerForm influencer={data} action={updateInfluencerAction} profileScreenshotUrl={screenshotUrl} />
    </div>
  );
}
