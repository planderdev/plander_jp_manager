import { createClient } from '@/lib/supabase/server';
import { createAdminAction } from '@/actions/admins';
import PhoneInput from '@/components/PhoneInput';
import SubmitButton from '@/components/SubmitButton';
import {
  saveApifyTokenAction,
  getApifyTokenStatus,
  getDeliverySettingsStatus,
  saveDeliverySettingsAction,
} from '@/actions/settings';
import { syncAllPosts } from '@/actions/sync-metrics';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { deleteAdminAction } from '@/actions/admins';
import { dateLocale } from '@/lib/datetime';
import { getI18n } from '@/lib/i18n/server';

export default async function AdminsPage() {
  const { locale, t } = await getI18n();
  const sb = await createClient();
  const { data: admins } = await sb.from('admins').select('*').order('created_at', { ascending: false });
  const tokenStatus = await getApifyTokenStatus();
  const deliverySettings = await getDeliverySettingsStatus();
  const { data: actorRow } = await sb.from('app_settings').select('value').eq('key', 'apify_actor_id').single();
  const actorId = actorRow?.value ?? '';

  return (
    <div className="p-4 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold">{t('admin.title')}</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t('admin.new')}</h2>
        <form action={createAdminAction} className="bg-white p-6 rounded-lg shadow space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <F name="name" label={t('admin.name')} required />
            <F name="company" label={t('admin.company')} />
            <F name="title" label={t('admin.jobTitle')} />
            <div>
              <label className="text-sm block mb-1 font-medium">{t('common.phone')}</label>
              <PhoneInput name="phone" />
            </div>
            <F name="email" label={t('admin.emailLogin')} type="email" required />
            <F name="password" label={t('admin.passwordMin')} type="password" required />
          </div>
          <SubmitButton>{t('common.create')}</SubmitButton>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t('admin.list')}</h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">{t('sales.owner')}</th>
                <th className="p-3">{t('admin.company')}</th>
                <th className="p-3">{t('admin.jobTitle')}</th>
                <th className="p-3">{t('common.email')}</th>
                <th className="p-3">{t('common.phone')}</th>
                <th className="p-3">{t('common.createdAt')}</th>
                <th className="p-3">{t('common.management')}</th>
              </tr>
            </thead>
            <tbody>
              {admins?.map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3 font-medium">{a.name}</td>
                  <td className="p-3">{a.company ?? '-'}</td>
                  <td className="p-3">{a.title ?? '-'}</td>
                  <td className="p-3">{a.email}</td>
                  <td className="p-3">{a.phone ?? '-'}</td>
                  <td className="p-3">{new Date(a.created_at).toLocaleDateString(dateLocale(locale))}</td>
                  <td className="p-3 space-x-2">
                    <Link href={`/extras/admins/${a.id}`} className="text-blue-600">{t('common.edit')}</Link>
                    <form action={async () => {
                      'use server';
                      await deleteAdminAction(a.id);
                    }} className="inline">
                      <button className="text-red-500"
                        formAction={async () => { 'use server'; await deleteAdminAction(a.id); }}>
                        {t('common.delete')}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">{t('admin.deliverySettings')}</h2>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h3 className="text-base font-semibold">{t('admin.emailSettings')}</h3>
            <form action={saveDeliverySettingsAction} className="space-y-3">
              <div>
                <label className="text-sm block mb-1 font-medium">{t('admin.emailRecipient')}</label>
                <input name="email_recipient" defaultValue={deliverySettings.emailRecipient}
                  className="w-full border border-gray-400 rounded p-2" />
              </div>
              <div>
                <label className="text-sm block mb-1 font-medium">{t('admin.emailSender')}</label>
                <input name="email_sender" defaultValue={deliverySettings.emailSender}
                  className="w-full border border-gray-400 rounded p-2" />
              </div>
              <div className="text-xs text-gray-500">
                Resend API 키는 서버 환경변수 `RESEND_API_KEY` 로 사용됩니다.
              </div>
              <SubmitButton>{t('common.save')}</SubmitButton>
            </form>
          </div>

          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h3 className="text-base font-semibold">{t('admin.lineSettings')}</h3>
            <form action={saveDeliverySettingsAction} className="space-y-3">
              <div>
                <label className="text-sm block mb-1 font-medium">{t('admin.lineChannelAccessToken')}</label>
                <input type="password" name="line_channel_access_token" defaultValue={deliverySettings.lineChannelAccessToken}
                  className="w-full border border-gray-400 rounded p-2" />
              </div>
              <div>
                <label className="text-sm block mb-1 font-medium">{t('admin.lineDestinationId')}</label>
                <input name="line_destination_id" defaultValue={deliverySettings.lineDestinationId}
                  className="w-full border border-gray-400 rounded p-2" />
              </div>
              <div>
                <label className="text-sm block mb-1 font-medium">{t('admin.storeMessageTemplate')}</label>
                <textarea name="line_store_message_template" defaultValue={deliverySettings.lineStoreMessageTemplate}
                  rows={4} className="w-full border border-gray-400 rounded p-2" />
              </div>
              <div>
                <label className="text-sm block mb-1 font-medium">{t('admin.influencerMessageTemplate')}</label>
                <textarea name="line_influencer_message_template" defaultValue={deliverySettings.lineInfluencerMessageTemplate}
                  rows={4} className="w-full border border-gray-400 rounded p-2" />
              </div>
              <p className="text-xs text-gray-500">{t('admin.lineHelp')}</p>
              <SubmitButton>{t('common.save')}</SubmitButton>
            </form>
          </div>

          <div className="bg-white p-6 rounded-lg shadow space-y-4 xl:col-span-2">
            <h3 className="text-base font-semibold">{t('admin.kakaoSettings')}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <form action={saveDeliverySettingsAction} className="space-y-3">
                <div>
                  <label className="text-sm block mb-1 font-medium">{t('admin.kakaoJavascriptKey')}</label>
                  <input type="password" name="kakao_javascript_key" defaultValue={deliverySettings.kakaoJavascriptKey}
                    className="w-full border border-gray-400 rounded p-2" />
                </div>
                <div>
                  <label className="text-sm block mb-1 font-medium">{t('admin.kakaoRestApiKey')}</label>
                  <input type="password" name="kakao_rest_api_key" defaultValue={deliverySettings.kakaoRestApiKey}
                    className="w-full border border-gray-400 rounded p-2" />
                </div>
                <div>
                  <label className="text-sm block mb-1 font-medium">{t('admin.kakaoAdminKey')}</label>
                  <input type="password" name="kakao_admin_key" defaultValue={deliverySettings.kakaoAdminKey}
                    className="w-full border border-gray-400 rounded p-2" />
                </div>
                <div>
                  <label className="text-sm block mb-1 font-medium">{t('admin.kakaoSenderKey')}</label>
                  <input name="kakao_sender_key" defaultValue={deliverySettings.kakaoSenderKey}
                    className="w-full border border-gray-400 rounded p-2" />
                </div>
                <SubmitButton>{t('common.save')}</SubmitButton>
              </form>

              <form action={saveDeliverySettingsAction} className="space-y-3 md:col-span-2">
                <div>
                  <label className="text-sm block mb-1 font-medium">{t('admin.storeMessageTemplate')}</label>
                  <textarea name="kakao_store_message_template" defaultValue={deliverySettings.kakaoStoreMessageTemplate}
                    rows={4} className="w-full border border-gray-400 rounded p-2" />
                </div>
                <div>
                  <label className="text-sm block mb-1 font-medium">{t('admin.influencerMessageTemplate')}</label>
                  <textarea name="kakao_influencer_message_template" defaultValue={deliverySettings.kakaoInfluencerMessageTemplate}
                    rows={4} className="w-full border border-gray-400 rounded p-2" />
                </div>
                <p className="text-xs text-amber-600">{t('admin.kakaoLimitNote')}</p>
                <SubmitButton>{t('common.save')}</SubmitButton>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t('admin.apifySettings')}</h2>
        <div className="bg-white p-6 rounded-lg shadow space-y-4 max-w-2xl">
          <div className="text-sm text-gray-700">
            <p>{t('admin.apifyDescription')}</p>
            <p className="text-xs text-gray-500 mt-1">
              {t('admin.apifyHelp')}
            </p>
          </div>
      
          <div className="text-sm">
            {t('common.currentStatus')}: {tokenStatus.hasToken
              ? <span className="text-green-600 font-semibold">{t('common.connected')} ({tokenStatus.masked})</span>
              : <span className="text-orange-600 font-semibold">{t('common.notConnected')} ({t('common.mockMode')})</span>}
          </div>
      
          <form action={saveApifyTokenAction} className="space-y-3">
            <div>
              <label className="text-sm block mb-1 font-medium">Apify API Token</label>
              <input type="password" name="apify_token"
                placeholder={tokenStatus.hasToken ? t('admin.tokenPlaceholder') : 'apify_api_xxxxxxxx'}
                className="w-full border border-gray-400 rounded p-2" />
            </div>
            <div>
              <label className="text-sm block mb-1 font-medium">{t('admin.actorId')}</label>
              <input name="apify_actor_id" defaultValue={actorId ?? 'apify~instagram-post-scraper'}
                placeholder="apify~instagram-post-scraper"
                className="w-full border border-gray-400 rounded p-2" />
            </div>
            <SubmitButton>{t('common.save')}</SubmitButton>
          </form>
        </div>
      </section>
      
      <section>
        <h2 className="text-lg font-semibold mb-3">{t('admin.metricsSync')}</h2>
        <div className="bg-white p-6 rounded-lg shadow space-y-4 max-w-2xl">
          <div className="text-sm text-gray-700">
            <p>{t('admin.syncTarget')}</p>
            <p className="text-xs text-gray-500 mt-1">
              {t('admin.syncHelp')}
            </p>
          </div>
          <form action={async () => {
            'use server';
            const result = await syncAllPosts();
            console.log('[sync result]', result);
            revalidatePath('/influencers/posts');
          }}>
            <SubmitButton>{t('admin.syncNow')}</SubmitButton>
          </form>
        </div>
      </section>
    </div>
  );
}

function F({ name, label, type = 'text', required }: any) {
  return (
    <div>
      <label className="text-sm block mb-1 font-medium">{label}</label>
      <input name={name} type={type} required={required}
        className="w-full border border-gray-400 rounded p-2" />
    </div>
  );
}
