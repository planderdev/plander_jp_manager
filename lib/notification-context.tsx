'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/provider';
import { useCallback } from 'react';

type NotificationSummary = {
  applications: {
    newCount: number;
    latestCreatedAt: string | null;
  };
  briefEmails: {
    newCount: number;
    latestSentAt: string | null;
    latestLabel: string | null;
  };
};

type ToastItem = {
  id: string;
  title: string;
  body: string;
};

type NotificationContextValue = {
  newApplicantCount: number;
};

const NotificationContext = createContext<NotificationContextValue>({
  newApplicantCount: 0,
});

const APPLICATIONS_SEEN_KEY = 'planderjp_seen_applications_at';
const APPLICATIONS_NOTIFIED_KEY = 'planderjp_notified_applications_at';
const BRIEF_EMAIL_NOTIFIED_KEY = 'planderjp_notified_brief_email_at';
const NOTIFICATION_PERMISSION_KEY = 'planderjp_notification_permission_requested';

function readLocalStorage(key: string) {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

function writeLocalStorage(key: string, value: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
}

function nowIso() {
  return new Date().toISOString();
}

function useBrowserNotification() {
  return useCallback((title: string, body: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (window.Notification.permission !== 'granted') return;
    new window.Notification(title, { body });
  }, []);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [newApplicantCount, setNewApplicantCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const mountedRef = useRef(false);
  const notifyBrowser = useBrowserNotification();

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (window.Notification.permission !== 'default') return;
    if (readLocalStorage(NOTIFICATION_PERMISSION_KEY)) return;

    writeLocalStorage(NOTIFICATION_PERMISSION_KEY, nowIso());
    void window.Notification.requestPermission();
  }, []);

  useEffect(() => {
    const latestSeen = readLocalStorage(APPLICATIONS_SEEN_KEY);
    const latestNotifiedApp = readLocalStorage(APPLICATIONS_NOTIFIED_KEY);
    const latestNotifiedEmail = readLocalStorage(BRIEF_EMAIL_NOTIFIED_KEY);

    if (!latestSeen) writeLocalStorage(APPLICATIONS_SEEN_KEY, nowIso());
    if (!latestNotifiedApp) writeLocalStorage(APPLICATIONS_NOTIFIED_KEY, nowIso());
    if (!latestNotifiedEmail) writeLocalStorage(BRIEF_EMAIL_NOTIFIED_KEY, nowIso());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const applicationsSince = readLocalStorage(APPLICATIONS_SEEN_KEY) ?? nowIso();
      const applicationsNotifiedAt = readLocalStorage(APPLICATIONS_NOTIFIED_KEY) ?? applicationsSince;
      const emailsSince = readLocalStorage(BRIEF_EMAIL_NOTIFIED_KEY) ?? nowIso();

      const response = await fetch(
        `/api/notifications/summary?applicationsSince=${encodeURIComponent(applicationsSince)}&emailsSince=${encodeURIComponent(emailsSince)}`,
        { cache: 'no-store' }
      );

      if (!response.ok || cancelled) return;

      const data = (await response.json()) as NotificationSummary;

      if (pathname?.startsWith('/influencers/applications')) {
        setNewApplicantCount(0);
        writeLocalStorage(APPLICATIONS_SEEN_KEY, data.applications.latestCreatedAt ?? nowIso());
      } else {
        setNewApplicantCount(data.applications.newCount);
      }

      if (
        mountedRef.current &&
        data.applications.newCount > 0 &&
        data.applications.latestCreatedAt &&
        new Date(data.applications.latestCreatedAt).getTime() > new Date(applicationsNotifiedAt).getTime()
      ) {
        const title = t('notifications.newApplicants');
        const body = t('notifications.newApplicantsBody', { count: data.applications.newCount });
        setToasts((current) => [...current, { id: `app-${data.applications.latestCreatedAt}`, title, body }]);
        notifyBrowser(title, body);
        writeLocalStorage(APPLICATIONS_NOTIFIED_KEY, data.applications.latestCreatedAt);
      }

      if (
        mountedRef.current &&
        data.briefEmails.newCount > 0 &&
        data.briefEmails.latestSentAt
      ) {
        const title = t('notifications.briefEmailSent');
        const body = data.briefEmails.latestLabel
          ? t('notifications.briefEmailSentBody', { label: data.briefEmails.latestLabel })
          : t('notifications.briefEmailSentBodyFallback', { count: data.briefEmails.newCount });
        setToasts((current) => [...current, { id: `mail-${data.briefEmails.latestSentAt}`, title, body }]);
        notifyBrowser(title, body);
        writeLocalStorage(BRIEF_EMAIL_NOTIFIED_KEY, data.briefEmails.latestSentAt);
      }

      mountedRef.current = true;
    }

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [notifyBrowser, pathname, t]);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const value = useMemo(() => ({ newApplicantCount }), [newApplicantCount]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-2xl border border-black/10 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
            <div className="text-sm font-semibold text-black">{toast.title}</div>
            <div className="mt-1 text-sm text-gray-600">{toast.body}</div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
