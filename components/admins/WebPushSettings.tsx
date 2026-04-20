'use client';

import { useEffect, useMemo, useState } from 'react';

import { useI18n } from '@/lib/i18n/provider';

type PermissionState = NotificationPermission | 'unsupported';

type StatusResponse = {
  configured: boolean;
  publicKey: string | null;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function getRegistration() {
  return navigator.serviceWorker.register('/sw.js');
}

export default function WebPushSettings() {
  const { locale, t } = useI18n();
  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [permission, setPermission] = useState<PermissionState>('unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const isSupported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setSupported(isSupported);
    setPermission(isSupported ? window.Notification.permission : 'unsupported');

    if (!isSupported) return;

    let cancelled = false;

    async function load() {
      try {
        const response = await fetch('/api/push/status', { cache: 'no-store' });
        if (!response.ok) return;

        const data = await response.json() as StatusResponse;
        if (cancelled) return;

        setConfigured(data.configured);
        setPublicKey(data.publicKey ?? '');

        const registration = await getRegistration();
        const subscription = await registration.pushManager.getSubscription();
        if (!cancelled) {
          setSubscribed(Boolean(subscription));
        }
      } catch (error) {
        console.error('web push status load failed', error);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const permissionLabel = useMemo(() => {
    if (permission === 'granted') return t('admin.webPushGranted');
    if (permission === 'denied') return t('admin.webPushDenied');
    if (permission === 'default') return t('admin.webPushDefault');
    return t('admin.webPushUnsupported');
  }, [permission, t]);

  async function handleEnable() {
    if (!supported) return;
    setBusy(true);
    setMessage('');

    try {
      const response = await fetch('/api/push/status', { cache: 'no-store' });
      const status = await response.json() as StatusResponse;

      if (!response.ok || !status.configured || !status.publicKey) {
        setMessage(t('admin.webPushConfigError'));
        return;
      }

      const registration = await getRegistration();
      const permissionResult = await window.Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        setMessage(t('admin.webPushDeniedHelp'));
        return;
      }

      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(status.publicKey),
      });

      const saveResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          locale,
        }),
      });

      if (!saveResponse.ok) {
        setMessage(t('admin.webPushGenericError'));
        return;
      }

      setConfigured(status.configured);
      setPublicKey(status.publicKey);
      setSubscribed(true);
      setMessage(t('admin.webPushEnableSuccess'));
    } catch (error) {
      console.error('web push enable failed', error);
      setMessage(t('admin.webPushGenericError'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    if (!supported) return;
    setBusy(true);
    setMessage('');

    try {
      const registration = await getRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setSubscribed(false);
      setMessage(t('admin.webPushDisableSuccess'));
    } catch (error) {
      console.error('web push disable failed', error);
      setMessage(t('admin.webPushGenericError'));
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    setBusy(true);
    setMessage('');

    try {
      const response = await fetch('/api/push/test', { method: 'POST' });
      if (!response.ok) {
        setMessage(t('admin.webPushGenericError'));
        return;
      }

      setMessage(t('admin.webPushTestSuccess'));
    } catch (error) {
      console.error('web push test failed', error);
      setMessage(t('admin.webPushGenericError'));
    } finally {
      setBusy(false);
    }
  }

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
