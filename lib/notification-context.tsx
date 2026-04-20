'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/provider';
import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

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
  const supabase = useMemo(() => createClient(), []);

  const pushToast = useCallback((title: string, body: string, id: string) => {
    setToasts((current) => {
      if (current.some((toast) => toast.id === id)) return current;
      return [...current, { id, title, body }];
    });
    notifyBrowser(title, body);
  }, [notifyBrowser]);

  const syncSummary = useCallback(async () => {
    const applicationsSince = readLocalStorage(APPLICATIONS_SEEN_KEY) ?? nowIso();
    const applicationsNotifiedAt = readLocalStorage(APPLICATIONS_NOTIFIED_KEY) ?? applicationsSince;
    const emailsSince = readLocalStorage(BRIEF_EMAIL_NOTIFIED_KEY) ?? nowIso();

    const response = await fetch(
      `/api/notifications/summary?applicationsSince=${encodeURIComponent(applicationsSince)}&emailsSince=${encodeURIComponent(emailsSince)}`,
      { cache: 'no-store' }
    );

    if (!response.ok) return null;

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
      pushToast(
        t('notifications.newApplicants'),
        t('notifications.newApplicantsBody', { count: data.applications.newCount }),
        `app-${data.applications.latestCreatedAt}`
      );
      writeLocalStorage(APPLICATIONS_NOTIFIED_KEY, data.applications.latestCreatedAt);
    }

    if (mountedRef.current && data.briefEmails.newCount > 0 && data.briefEmails.latestSentAt) {
      pushToast(
        t('notifications.briefEmailSent'),
        data.briefEmails.latestLabel
          ? t('notifications.briefEmailSentBody', { label: data.briefEmails.latestLabel })
          : t('notifications.briefEmailSentBodyFallback', { count: data.briefEmails.newCount }),
        `mail-${data.briefEmails.latestSentAt}`
      );
      writeLocalStorage(BRIEF_EMAIL_NOTIFIED_KEY, data.briefEmails.latestSentAt);
    }

    mountedRef.current = true;
    return data;
  }, [pathname, pushToast, t]);

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

    void syncSummary();

    const applicantChannel = supabase
      .channel('notifications-influencer-applications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'influencer_applications',
        },
        (payload) => {
          if (cancelled) return;
          const createdAt = String((payload.new as Record<string, unknown>)?.created_at ?? nowIso());
          const status = String((payload.new as Record<string, unknown>)?.status ?? 'pending');

          if (status !== 'pending') return;

          if (pathname?.startsWith('/influencers/applications')) {
            writeLocalStorage(APPLICATIONS_SEEN_KEY, createdAt);
            setNewApplicantCount(0);
          } else {
            setNewApplicantCount((current) => current + 1);
          }

          if (!mountedRef.current) return;

          pushToast(
            t('notifications.newApplicants'),
            t('notifications.newApplicantsBody', { count: 1 }),
            `app-${createdAt}`
          );
          writeLocalStorage(APPLICATIONS_NOTIFIED_KEY, createdAt);
        }
      )
      .subscribe();

    const emailChannel = supabase
      .channel('notifications-brief-email-log')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
          filter: 'key=eq.brief_email_log',
        },
        () => {
          if (cancelled) return;
          void syncSummary();
        }
      )
      .subscribe();

    const interval = window.setInterval(() => {
      void syncSummary();
    }, 300000);

    return () => {
      cancelled = true;
      void supabase.removeChannel(applicantChannel);
      void supabase.removeChannel(emailChannel);
      window.clearInterval(interval);
    };
  }, [pathname, pushToast, supabase, syncSummary, t]);

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
