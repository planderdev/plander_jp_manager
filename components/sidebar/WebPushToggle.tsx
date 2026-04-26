'use client';

import { useI18n } from '@/lib/i18n/provider';
import { useWebPush } from '@/lib/use-web-push';

export default function WebPushToggle() {
  const { t } = useI18n();
  const {
    busy,
    configured,
    handleDisable,
    handleEnable,
    message,
    subscribed,
    supported,
  } = useWebPush();

  const disabled = busy || !supported || !configured;

  return (
    <div className="mt-3 mb-2 w-full rounded border border-gray-700 bg-transparent p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-gray-400">{t('sidebar.pushAlerts')}</div>
          <div className="mt-1 text-sm text-white">
            {subscribed ? t('admin.webPushSubscribed') : t('admin.webPushNotSubscribed')}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={subscribed}
          aria-label={t('sidebar.pushAlerts')}
          disabled={disabled}
          onClick={() => {
            if (subscribed) {
              void handleDisable();
              return;
            }
            void handleEnable();
          }}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
            subscribed ? 'bg-yellow-500' : 'bg-gray-700'
          } ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:opacity-90'}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
              subscribed ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {message ? (
        <p className="mt-2 text-xs text-gray-300">{message}</p>
      ) : null}
    </div>
  );
}
