'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

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

export function useWebPush() {
  const { locale, t } = useI18n();
  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [permission, setPermission] = useState<PermissionState>('unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refreshStatus = useCallback(async () => {
    const response = await fetch('/api/push/status', { cache: 'no-store' });
    if (!response.ok) return;

    const data = await response.json() as StatusResponse;
    setConfigured(data.configured);
    setPublicKey(data.publicKey ?? '');

    const registration = await getRegistration();
    const subscription = await registration.pushManager.getSubscription();
    setSubscribed(Boolean(subscription));
  }, []);

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
        if (cancelled) return;
        await refreshStatus();
      } catch (error) {
        console.error('web push status load failed', error);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [refreshStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleChanged = () => {
      void refreshStatus().catch((error) => {
        console.error('web push status refresh failed', error);
      });
    };

    window.addEventListener('plander:webpush-changed', handleChanged);
    return () => window.removeEventListener('plander:webpush-changed', handleChanged);
  }, [refreshStatus]);

  const permissionLabel = useMemo(() => {
    if (permission === 'granted') return t('admin.webPushGranted');
    if (permission === 'denied') return t('admin.webPushDenied');
    if (permission === 'default') return t('admin.webPushDefault');
    return t('admin.webPushUnsupported');
  }, [permission, t]);

  async function handleEnable() {
    if (!supported) return false;
    setBusy(true);
    setMessage('');

    try {
      const response = await fetch('/api/push/status', { cache: 'no-store' });
      const status = await response.json() as StatusResponse;

      if (!response.ok || !status.configured || !status.publicKey) {
        setMessage(t('admin.webPushConfigError'));
        return false;
      }

      const registration = await getRegistration();
      const permissionResult = await window.Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        setMessage(t('admin.webPushDeniedHelp'));
        return false;
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
        return false;
      }

      setConfigured(status.configured);
      setPublicKey(status.publicKey);
      setSubscribed(true);
      setMessage(t('admin.webPushEnableSuccess'));
      window.dispatchEvent(new Event('plander:webpush-changed'));
      return true;
    } catch (error) {
      console.error('web push enable failed', error);
      setMessage(t('admin.webPushGenericError'));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    if (!supported) return false;
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
      window.dispatchEvent(new Event('plander:webpush-changed'));
      return true;
    } catch (error) {
      console.error('web push disable failed', error);
      setMessage(t('admin.webPushGenericError'));
      return false;
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
        return false;
      }

      setMessage(t('admin.webPushTestSuccess'));
      return true;
    } catch (error) {
      console.error('web push test failed', error);
      setMessage(t('admin.webPushGenericError'));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    configured,
    handleDisable,
    handleEnable,
    handleTest,
    message,
    permission,
    permissionLabel,
    publicKey,
    setMessage,
    subscribed,
    supported,
  };
}
