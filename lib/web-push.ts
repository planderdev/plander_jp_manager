import 'server-only';

import webpush from 'web-push';

import { createAdminClient } from '@/lib/supabase/admin';

type LocaleCode = 'ko' | 'ja';

type WebPushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

type StoredSubscription = {
  endpoint: string;
  subscription: {
    endpoint: string;
    expirationTime?: number | null;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  locale: string | null;
};

const APP_BASE_URL_KEY = 'web_push_app_base_url';
const APPLICANT_WEBHOOK_SECRET_KEY = 'web_push_applicant_webhook_secret';

function getAppBaseUrl() {
  return (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://plander-jp-manager.vercel.app').replace(/\/$/, '');
}

function getWebPushConfig() {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY ?? '';
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY ?? '';
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT ?? 'mailto:planderjp@gmail.com';

  return {
    configured: Boolean(publicKey && privateKey),
    publicKey,
    privateKey,
    subject,
  };
}

function configureWebPush() {
  const config = getWebPushConfig();
  if (!config.configured) return config;

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return config;
}

function resolveLocale(locale: string | null): LocaleCode {
  return locale?.toLowerCase().startsWith('ja') ? 'ja' : 'ko';
}

async function readSetting(key: string) {
  const sb = createAdminClient();
  const { data } = await sb.from('app_settings').select('value').eq('key', key).maybeSingle();
  return typeof data?.value === 'string' ? data.value : null;
}

async function writeSetting(key: string, value: string) {
  const sb = createAdminClient();
  await sb.from('app_settings').upsert(
    {
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );
}

export async function ensureWebPushBackendSettings() {
  const appBaseUrl = getAppBaseUrl();
  const [currentBaseUrl, currentSecret] = await Promise.all([
    readSetting(APP_BASE_URL_KEY),
    readSetting(APPLICANT_WEBHOOK_SECRET_KEY),
  ]);

  const webhookSecret = currentSecret || crypto.randomUUID();

  if (currentBaseUrl !== appBaseUrl) {
    await writeSetting(APP_BASE_URL_KEY, appBaseUrl);
  }
  if (!currentSecret) {
    await writeSetting(APPLICANT_WEBHOOK_SECRET_KEY, webhookSecret);
  }

  return { appBaseUrl, webhookSecret };
}

export async function getWebPushStatus() {
  const config = configureWebPush();
  if (!config.configured) {
    return {
      configured: false,
      publicKey: null,
    };
  }

  await ensureWebPushBackendSettings();

  return {
    configured: true,
    publicKey: config.publicKey,
  };
}

export async function getApplicantWebhookSecret() {
  await ensureWebPushBackendSettings();
  return readSetting(APPLICANT_WEBHOOK_SECRET_KEY);
}

export async function upsertWebPushSubscription(input: {
  subscription: StoredSubscription['subscription'];
  locale: string | null;
  userAgent: string | null;
}) {
  const sb = createAdminClient();

  await sb.from('push_subscriptions').upsert(
    {
      endpoint: input.subscription.endpoint,
      subscription: input.subscription,
      locale: input.locale,
      user_agent: input.userAgent,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );
}

export async function deleteWebPushSubscription(endpoint: string) {
  const sb = createAdminClient();
  await sb.from('push_subscriptions').delete().eq('endpoint', endpoint);
}

async function listWebPushSubscriptions() {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('push_subscriptions')
    .select('endpoint, subscription, locale')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StoredSubscription[];
}

export async function sendWebPushNotification(
  payloadFactory: WebPushPayload | ((locale: LocaleCode) => WebPushPayload)
) {
  const config = configureWebPush();
  if (!config.configured) {
    return { total: 0, sent: 0, removed: 0, failed: 0, skipped: true };
  }

  const subscriptions = await listWebPushSubscriptions();
  let sent = 0;
  let removed = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (row) => {
      const payload =
        typeof payloadFactory === 'function' ? payloadFactory(resolveLocale(row.locale)) : payloadFactory;

      try {
        await webpush.sendNotification(row.subscription, JSON.stringify(payload));
        sent += 1;
      } catch (error) {
        const statusCode = typeof error === 'object' && error && 'statusCode' in error
          ? Number((error as { statusCode?: number }).statusCode)
          : null;

        if (statusCode === 404 || statusCode === 410) {
          await deleteWebPushSubscription(row.endpoint);
          removed += 1;
          return;
        }

        failed += 1;
        console.error('web push send failed', { endpoint: row.endpoint, error });
      }
    })
  );

  return {
    total: subscriptions.length,
    sent,
    removed,
    failed,
    skipped: false,
  };
}
