import { createClient } from '@/lib/supabase/server';
import SubmitButton from '@/components/SubmitButton';
import {
  saveApifyTokenAction,
  getApifyTokenStatus,
  getDeliverySettingsStatus,
  getLineWebhookStatusAction,
  saveDeliverySettingsAction,
} from '@/actions/settings';
import { syncAllPosts } from '@/actions/sync-metrics';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { deleteAdminAction } from '@/actions/admins';
import { dateLocale } from '@/lib/datetime';
import { getI18n } from '@/lib/i18n/server';
import AdminCreateDialog from '@/components/admins/AdminCreateDialog';
import WebPushSettings from '@/components/admins/WebPushSettings';
import SortableHeaderLink from '@/components/table/SortableHeaderLink';
import { sortItems, type SortOrder } from '@/lib/table-sort';

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: SortOrder }>;
}) {
  const currentSearchParams = await searchParams;
  const { locale, t } = await getI18n();
  const sb = await createClient();
  const { data: admins } = await sb.from('admins').select('*').order('created_at', { ascending: false });
  const currentSort = currentSearchParams.sort ?? 'created_at';
  const currentOrder = currentSearchParams.order === 'asc' ? 'asc' : 'desc';
  const sortedAdmins = sortItems(admins ?? [], (admin) => {
    switch (currentSort) {
      case 'name':
        return admin.name;
      case 'company':
        return admin.company;
      case 'title':
        return admin.title;
      case 'email':
        return admin.email;
      case 'phone':
        return admin.phone;
      default:
        return admin.created_at;
    }
  }, currentOrder);
  const tokenStatus = await getApifyTokenStatus();
  const deliverySettings = await getDeliverySettingsStatus();
  const lineWebhookStatus = await getLineWebhookStatusAction();
  const { data: actorRow } = await sb.from('app_settings').select('value').eq('key', 'apify_actor_id').single();
  const actorId = actorRow?.value ?? '';
  const appBaseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://plander-jp-manager.vercel.app';
  const lineWebhookUrl = `${appBaseUrl}/api/line/webhook`;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold">{t('admin.title')}</h1>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t('admin.list')}</h2>
          <AdminCreateDialog />
        </div>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3"><SortableHeaderLink label={t('sales.owner')} sortKey="name" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
                <th className="p-3"><SortableHeaderLink label={t('admin.company')} sortKey="company" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
                <th className="p-3"><SortableHeaderLink label={t('admin.jobTitle')} sortKey="title" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
                <th className="p-3"><SortableHeaderLink label={t('common.email')} sortKey="email" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
                <th className="p-3"><SortableHeaderLink label={t('common.phone')} sortKey="phone" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
                <th className="p-3"><SortableHeaderLink label={t('common.createdAt')} sortKey="created_at" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
                <th className="p-3">{t('common.management')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedAdmins.map((a: any) => (
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
          <WebPushSettings />

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
                <label className="text-sm block mb-1 font-medium">{t('admin.lineChannelSecret')}</label>
                <input type="password" name="line_channel_secret" defaultValue={deliverySettings.lineChannelSecret}
                  className="w-full border border-gray-400 rounded p-2" />
              </div>
              <div>
                <label className="text-sm block mb-1 font-medium">{t('admin.lineDestinationId')}</label>
                <input name="line_destination_id" defaultValue={deliverySettings.lineDestinationId}
                  className="w-full border border-gray-400 rounded p-2" />
              </div>
              <div>
                <label className="text-sm block mb-1 font-medium">{t('admin.lineSendHoursBefore')}</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  step="1"
                  name="line_send_hours_before"
                  defaultValue={deliverySettings.lineSendHoursBefore}
                  className="w-full max-w-xs border border-gray-400 rounded p-2"
                />
                <p className="mt-1 text-xs text-gray-500">{t('admin.lineSendHoursBeforeHelp')}</p>
              </div>
              <div>
                <label className="text-sm block mb-1 font-medium">{t('admin.lineWebhookUrl')}</label>
                <input value={lineWebhookUrl} readOnly
                  className="w-full border border-gray-300 bg-gray-50 rounded p-2 text-sm text-gray-700" />
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
                <div>{t('admin.lineWebhookLastReceived')}: {lineWebhookStatus.lastReceivedAt ?? '-'}</div>
                <div>{t('admin.lineWebhookLastEvent')}: {lineWebhookStatus.lastEventType ?? '-'}</div>
                <div>{t('admin.lineWebhookLastSource')}: {lineWebhookStatus.lastSourceType ?? '-'} / {lineWebhookStatus.lastSourceId ?? '-'}</div>
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
