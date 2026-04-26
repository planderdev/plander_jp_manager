'use client';

import { useI18n } from '@/lib/i18n/provider';
import { useWebPush } from '@/lib/use-web-push';

export default function WebPushSettings() {
  const { t } = useI18n();
  const {
    busy,
    configured,
    handleDisable,
    handleEnable,
    handleTest,
    message,
    permission,
    permissionLabel,
    subscribed,
    supported,
  } = useWebPush();

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <h3 className="text-base font-semibold">{t('admin.webPushSettings')}</h3>
      <p className="text-sm text-gray-700">{t('admin.webPushDescription')}</p>
      <p className="text-xs text-gray-500">{t('admin.webPushInstallHint')}</p>

      {!supported ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {t('admin.webPushUnsupported')}
        </div>
      ) : (
        <>
          <div className="grid gap-2 text-sm">
            <div>
              <span className="font-medium">{t('admin.webPushPermission')}:</span>{' '}
              <span>{permissionLabel}</span>
            </div>
            <div>
              <span className="font-medium">{t('admin.webPushSubscription')}:</span>{' '}
              <span>{subscribed ? t('admin.webPushSubscribed') : t('admin.webPushNotSubscribed')}</span>
            </div>
          </div>

          {permission === 'denied' ? (
            <p className="text-xs text-red-500">{t('admin.webPushDeniedHelp')}</p>
          ) : (
            <p className="text-xs text-gray-500">{t('admin.webPushConnectedHelp')}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleEnable}
              disabled={busy || !configured}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {busy ? t('admin.webPushSaving') : t('admin.webPushEnable')}
            </button>
            <button
              type="button"
              onClick={handleDisable}
              disabled={busy || !subscribed}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              {t('admin.webPushDisable')}
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={busy || !subscribed}
              className="rounded border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-blue-300"
            >
              {t('admin.webPushTest')}
            </button>
          </div>

          {message && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {message}
            </div>
          )}
        </>
      )}
    </div>
  );
}
