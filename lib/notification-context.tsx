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
  todaySchedules: {
    count: number;
  };
};

type ToastItem = {
  id: string;
  title: string;
  body: string;
};

type PushToastOptions = {
  browser?: boolean;
};

type NotificationContextValue = {
  newApplicantCount: number;
  todayScheduleCount: number;
  markApplicantsSeen: () => void;
};

const NotificationContext = createContext<NotificationContextValue>({
  newApplicantCount: 0,
  todayScheduleCount: 0,
  markApplicantsSeen: () => {},
});

const APPLICATIONS_SEEN_KEY = 'planderjp_seen_applications_at';
const APPLICATIONS_NOTIFIED_KEY = 'planderjp_notified_applications_at';

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

export function NotificationProvider({
  children,
  initialFlash,
}: {
  children: React.ReactNode;
  initialFlash?: ToastItem | null;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [newApplicantCount, setNewApplicantCount] = useState(0);
  const [todayScheduleCount, setTodayScheduleCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const mountedRef = useRef(false);
  const notifyBrowser = useBrowserNotification();
  const supabase = useMemo(() => createClient(), []);

  const pushToast = useCallback((title: string, body: string, id: string, options?: PushToastOptions) => {
    setToasts((current) => {
      if (current.some((toast) => toast.id === id)) return current;
      return [...current, { id, title, body }];
    });
    if (options?.browser) {
      notifyBrowser(title, body);
    }
  }, [notifyBrowser]);

  const markApplicantsSeen = useCallback(() => {
    const seenAt = nowIso();
    writeLocalStorage(APPLICATIONS_SEEN_KEY, seenAt);
    writeLocalStorage(APPLICATIONS_NOTIFIED_KEY, seenAt);
    setNewApplicantCount(0);
  }, []);

  const syncSummary = useCallback(async () => {
    const applicationsSince = readLocalStorage(APPLICATIONS_SEEN_KEY) ?? nowIso();
    const applicationsNotifiedAt = readLocalStorage(APPLICATIONS_NOTIFIED_KEY) ?? applicationsSince;

    const response = await fetch(
      `/api/notifications/summary?applicationsSince=${encodeURIComponent(applicationsSince)}`,
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

    setTodayScheduleCount(data.todaySchedules.count);

    if (
      mountedRef.current &&
      data.applications.newCount > 0 &&
      data.applications.latestCreatedAt &&
      new Date(data.applications.latestCreatedAt).getTime() > new Date(applicationsNotifiedAt).getTime()
    ) {
      pushToast(
        t('notifications.newApplicants'),
        t('notifications.newApplicantsBody', { count: data.applications.newCount }),
        `app-${data.applications.latestCreatedAt}`,
        { browser: true }
      );
      writeLocalStorage(APPLICATIONS_NOTIFIED_KEY, data.applications.latestCreatedAt);
    }

    mountedRef.current = true;
    return data;
  }, [pathname, pushToast, t]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    void navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('service worker registration failed', error);
    });
  }, []);

  useEffect(() => {
    const latestSeen = readLocalStorage(APPLICATIONS_SEEN_KEY);
    const latestNotifiedApp = readLocalStorage(APPLICATIONS_NOTIFIED_KEY);

    if (!latestSeen) writeLocalStorage(APPLICATIONS_SEEN_KEY, nowIso());
    if (!latestNotifiedApp) writeLocalStorage(APPLICATIONS_NOTIFIED_KEY, nowIso());
  }, []);

  useEffect(() => {
    if (!pathname?.startsWith('/influencers/applications')) return;
    markApplicantsSeen();
  }, [markApplicantsSeen, pathname]);

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
            `app-${createdAt}`,
            { browser: true }
          );
          writeLocalStorage(APPLICATIONS_NOTIFIED_KEY, createdAt);
        }
      )
      .subscribe();

    const scheduleChannel = supabase
      .channel('notifications-today-schedules')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules',
        },
        () => {
          if (cancelled) return;
          void syncSummary();
        }
      )
      .subscribe();

    const lineContactChannel = supabase
      .channel('notifications-line-contacts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'line_contacts',
        },
        (payload) => {
          if (cancelled || !mountedRef.current) return;

          const row = payload.new as Record<string, unknown>;
          const createdAt = String(row.created_at ?? nowIso());
          const displayName = String(row.display_name ?? '').trim();

          pushToast(
            t('notifications.newLineContact'),
            displayName
              ? t('notifications.newLineContactBody', { name: displayName })
              : t('notifications.newLineContactBodyFallback'),
            `line-${createdAt}`,
            { browser: true }
          );
        }
      )
      .subscribe();

    const interval = window.setInterval(() => {
      void syncSummary();
    }, 300000);

    return () => {
      cancelled = true;
      void supabase.removeChannel(applicantChannel);
      void supabase.removeChannel(scheduleChannel);
      void supabase.removeChannel(lineContactChannel);
      window.clearInterval(interval);
    };
  }, [pathname, pushToast, supabase, syncSummary, t]);

  useEffect(() => {
    if (!initialFlash) return;

    pushToast(initialFlash.title, initialFlash.body, initialFlash.id);
    document.cookie = 'plander_flash=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }, [initialFlash, pushToast]);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const value = useMemo(() => ({
    newApplicantCount,
    todayScheduleCount,
    markApplicantsSeen,
  }), [markApplicantsSeen, newApplicantCount, todayScheduleCount]);

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
