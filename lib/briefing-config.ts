import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

const CLIENT_BRIEF_SETTINGS_KEY = 'client_brief_settings';
const INFLUENCER_MEDIA_SETTINGS_KEY = 'influencer_media_settings';
const DELIVERY_SETTINGS_KEY = 'delivery_channel_settings';
const BRIEF_EMAIL_LOG_KEY = 'brief_email_log';
const BRIEF_LINE_LOG_KEY = 'brief_line_log';
const LINE_WEBHOOK_STATUS_KEY = 'line_webhook_status';

export type ClientBriefConfig = {
  visitNotesJa: string;
  publishNotesJa: string;
  postNotesJa: string;
  shootNotesJa: string;
  visitNoticeTime: string;
};

export type InfluencerMediaConfig = {
  profileScreenshotPath: string | null;
};

export type DeliverySettings = {
  emailRecipient: string;
  emailSender: string;
  lineChannelAccessToken: string;
  lineChannelSecret: string;
  lineDestinationId: string;
  lineInfluencerMessageTemplate: string;
  kakaoJavascriptKey: string;
  kakaoRestApiKey: string;
  kakaoAdminKey: string;
  kakaoSenderKey: string;
  kakaoStoreMessageTemplate: string;
};

export type LineWebhookStatus = {
  lastReceivedAt: string | null;
  lastEventType: string | null;
  lastSourceType: string | null;
  lastSourceId: string | null;
  lastMessageText: string | null;
};

type BriefEmailLogEntry = {
  scheduledTargetDate?: string | null;
  scheduledAt?: string | null;
  lastScheduledRecipient?: string | null;
  lastManualAt?: string | null;
  lastManualRecipient?: string | null;
};

type BriefLineLogEntry = {
  scheduledTargetDate?: string | null;
  scheduledAt?: string | null;
  lastScheduledRecipient?: string | null;
  lastScheduledStatus?: string | null;
  lastScheduledError?: string | null;
  lastManualAt?: string | null;
  lastManualRecipient?: string | null;
  lastManualStatus?: string | null;
  lastManualError?: string | null;
};

export type BriefEmailNotificationEvent = {
  scheduleId: number;
  mode: 'manual' | 'scheduled';
  sentAt: string;
  recipient: string | null;
};

type JsonObject = Record<string, unknown>;

export const DEFAULT_CLIENT_BRIEF_CONFIG: ClientBriefConfig = {
  visitNotesJa: [
    '1. ご予約時間の厳守をお願いいたします。',
    '    時間変更がある場合は、遅くともご来店日の1日前までにご連絡をお願いいたします。',
    '2. 同行されるご友人がいらっしゃる場合は、Googleマップにて★5の高評価レビューを',
    '    訪問当日にご投稿いただけますと幸いです。',
    '3. ご来店後7日以内に動画の初稿をご提出いただき、内容修正にもご協力をお願いいたします。',
    '    店舗側の確認後、修正点がある場合はお伝えし、最終確認が完了次第アップロードをお願いいたします。',
    '    なお、最終動画の投稿はご来店日から14日以内にお願いいたします。',
    '4. アップロード後の削除はご遠慮ください。',
    '5. 投稿は日本国内からお願いいたします。',
  ].join('\n'),
  publishNotesJa: 'ご来店後14日以内に投稿',
  postNotesJa: '投稿時は関連するテーマと結びつけること（例：韓国旅行、韓国グルメ など）',
  shootNotesJa: [
    '1. 店舗入口、店舗内の全景撮影',
    '2. 店舗メニュー表またはテーブルオーダーの撮影（日本語翻訳メニューを強調）',
    '3. 広告っぽくない自然な雰囲気での撮影',
    '4. ご自身のアカウントの雰囲気に合わせて自由に撮影していただきつつ、お店の魅力が',
    '    しっかり伝わるようお願いいたします。',
  ].join('\n'),
  visitNoticeTime: '18:00',
};

export const DEFAULT_INFLUENCER_MEDIA_CONFIG: InfluencerMediaConfig = {
  profileScreenshotPath: null,
};

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  emailRecipient: '1986desire@gmail.com',
  emailSender: 'Plander <onboarding@resend.dev>',
  lineChannelAccessToken: '',
  lineChannelSecret: '',
  lineDestinationId: '',
  lineInfluencerMessageTemplate: '안녕하세요 {{influencerHandle}}님.\n내일 {{visitDate}} {{visitTime}} 방문 일정 안내드립니다.',
  kakaoJavascriptKey: '',
  kakaoRestApiKey: '',
  kakaoAdminKey: '',
  kakaoSenderKey: '',
  kakaoStoreMessageTemplate: '내일 {{visitDate}} 방문 일정 공유드립니다.\n{{influencerHandle}} / 팔로워 {{followers}}명 / 방문시간 {{visitTime}} / 방문인원 {{visitorCount}}명',
};

export const DEFAULT_LINE_WEBHOOK_STATUS: LineWebhookStatus = {
  lastReceivedAt: null,
  lastEventType: null,
  lastSourceType: null,
  lastSourceId: null,
  lastMessageText: null,
};

function mergeClientBriefConfig(input?: Partial<ClientBriefConfig> | null): ClientBriefConfig {
  return {
    visitNotesJa: normalizeMultiline(input?.visitNotesJa, DEFAULT_CLIENT_BRIEF_CONFIG.visitNotesJa),
    publishNotesJa: normalizeLine(input?.publishNotesJa, DEFAULT_CLIENT_BRIEF_CONFIG.publishNotesJa),
    postNotesJa: normalizeLine(input?.postNotesJa, DEFAULT_CLIENT_BRIEF_CONFIG.postNotesJa),
    shootNotesJa: normalizeMultiline(input?.shootNotesJa, DEFAULT_CLIENT_BRIEF_CONFIG.shootNotesJa),
    visitNoticeTime: normalizeTime(input?.visitNoticeTime, DEFAULT_CLIENT_BRIEF_CONFIG.visitNoticeTime),
  };
}

function mergeInfluencerMediaConfig(input?: Partial<InfluencerMediaConfig> | null): InfluencerMediaConfig {
  return {
    profileScreenshotPath: normalizeNullableString(input?.profileScreenshotPath),
  };
}

function mergeDeliverySettings(input?: Partial<DeliverySettings> | null): DeliverySettings {
  return {
    emailRecipient: normalizeLine(input?.emailRecipient, DEFAULT_DELIVERY_SETTINGS.emailRecipient),
    emailSender: normalizeLine(input?.emailSender, DEFAULT_DELIVERY_SETTINGS.emailSender),
    lineChannelAccessToken: normalizeNullableString(input?.lineChannelAccessToken) ?? '',
    lineChannelSecret: normalizeNullableString(input?.lineChannelSecret) ?? '',
    lineDestinationId: normalizeNullableString(input?.lineDestinationId) ?? '',
    lineInfluencerMessageTemplate: normalizeMultiline(input?.lineInfluencerMessageTemplate, DEFAULT_DELIVERY_SETTINGS.lineInfluencerMessageTemplate),
    kakaoJavascriptKey: normalizeNullableString(input?.kakaoJavascriptKey) ?? '',
    kakaoRestApiKey: normalizeNullableString(input?.kakaoRestApiKey) ?? '',
    kakaoAdminKey: normalizeNullableString(input?.kakaoAdminKey) ?? '',
    kakaoSenderKey: normalizeNullableString(input?.kakaoSenderKey) ?? '',
    kakaoStoreMessageTemplate: normalizeMultiline(input?.kakaoStoreMessageTemplate, DEFAULT_DELIVERY_SETTINGS.kakaoStoreMessageTemplate),
  };
}

function normalizeLine(value: unknown, fallback: string) {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function normalizeMultiline(value: unknown, fallback: string) {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function normalizeTime(value: unknown, fallback: string) {
  const text = String(value ?? '').trim();
  return /^\d{2}:\d{2}$/.test(text) ? text : fallback;
}

function normalizeNullableString(value: unknown) {
  const text = String(value ?? '').trim();
  return text || null;
}

function mergeLineWebhookStatus(input?: Partial<LineWebhookStatus> | null): LineWebhookStatus {
  return {
    lastReceivedAt: normalizeNullableString(input?.lastReceivedAt),
    lastEventType: normalizeNullableString(input?.lastEventType),
    lastSourceType: normalizeNullableString(input?.lastSourceType),
    lastSourceId: normalizeNullableString(input?.lastSourceId),
    lastMessageText: normalizeNullableString(input?.lastMessageText),
  };
}

async function readSettingValue(key: string) {
  const sb = createAdminClient();
  const { data } = await sb.from('app_settings').select('value').eq('key', key).maybeSingle();
  return data?.value ?? null;
}

async function writeSettingValue(key: string, value: string) {
  const sb = createAdminClient();
  await sb.from('app_settings').upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getClientBriefConfigMap() {
  const raw = await readSettingValue(CLIENT_BRIEF_SETTINGS_KEY);
  const parsed = parseJson<Record<string, Partial<ClientBriefConfig>>>(raw, {});
  return Object.fromEntries(
    Object.entries(parsed).map(([clientId, value]) => [clientId, mergeClientBriefConfig(value)])
  ) as Record<string, ClientBriefConfig>;
}

export async function getClientBriefConfig(clientId?: number | null) {
  if (!clientId) return DEFAULT_CLIENT_BRIEF_CONFIG;
  const map = await getClientBriefConfigMap();
  return map[String(clientId)] ?? DEFAULT_CLIENT_BRIEF_CONFIG;
}

export async function saveClientBriefConfig(clientId: number, input: Partial<ClientBriefConfig>) {
  const map = await getClientBriefConfigMap();
  map[String(clientId)] = mergeClientBriefConfig(input);
  await writeSettingValue(CLIENT_BRIEF_SETTINGS_KEY, JSON.stringify(map));
}

export async function getInfluencerMediaConfigMap() {
  const raw = await readSettingValue(INFLUENCER_MEDIA_SETTINGS_KEY);
  const parsed = parseJson<Record<string, Partial<InfluencerMediaConfig>>>(raw, {});
  return Object.fromEntries(
    Object.entries(parsed).map(([influencerId, value]) => [influencerId, mergeInfluencerMediaConfig(value)])
  ) as Record<string, InfluencerMediaConfig>;
}

export async function getInfluencerMediaConfig(influencerId?: number | null) {
  if (!influencerId) return DEFAULT_INFLUENCER_MEDIA_CONFIG;
  const map = await getInfluencerMediaConfigMap();
  return map[String(influencerId)] ?? DEFAULT_INFLUENCER_MEDIA_CONFIG;
}

export async function saveInfluencerMediaConfig(influencerId: number, input: Partial<InfluencerMediaConfig>) {
  const map = await getInfluencerMediaConfigMap();
  map[String(influencerId)] = mergeInfluencerMediaConfig({
    ...map[String(influencerId)],
    ...input,
  });
  await writeSettingValue(INFLUENCER_MEDIA_SETTINGS_KEY, JSON.stringify(map));
}

export async function getDeliverySettings() {
  const raw = await readSettingValue(DELIVERY_SETTINGS_KEY);
  return mergeDeliverySettings(parseJson<Partial<DeliverySettings>>(raw, {}));
}

export async function saveDeliverySettings(input: Partial<DeliverySettings>) {
  const current = await getDeliverySettings();
  const next = mergeDeliverySettings({ ...current, ...input });
  await writeSettingValue(DELIVERY_SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export async function getLineWebhookStatus() {
  const raw = await readSettingValue(LINE_WEBHOOK_STATUS_KEY);
  return mergeLineWebhookStatus(parseJson<Partial<LineWebhookStatus>>(raw, DEFAULT_LINE_WEBHOOK_STATUS));
}

export async function markLineWebhookReceived(input: Partial<LineWebhookStatus>) {
  const current = await getLineWebhookStatus();
  const next = mergeLineWebhookStatus({
    ...current,
    ...input,
    lastReceivedAt: input.lastReceivedAt ?? new Date().toISOString(),
  });
  await writeSettingValue(LINE_WEBHOOK_STATUS_KEY, JSON.stringify(next));
  return next;
}

async function getBriefEmailLogMap() {
  const raw = await readSettingValue(BRIEF_EMAIL_LOG_KEY);
  return parseJson<Record<string, BriefEmailLogEntry>>(raw, {});
}

async function saveBriefEmailLogMap(map: Record<string, BriefEmailLogEntry>) {
  await writeSettingValue(BRIEF_EMAIL_LOG_KEY, JSON.stringify(map));
}

async function getBriefLineLogMap() {
  const raw = await readSettingValue(BRIEF_LINE_LOG_KEY);
  return parseJson<Record<string, BriefLineLogEntry>>(raw, {});
}

async function saveBriefLineLogMap(map: Record<string, BriefLineLogEntry>) {
  await writeSettingValue(BRIEF_LINE_LOG_KEY, JSON.stringify(map));
}

export async function getBriefEmailLogEntry(scheduleId: number) {
  const map = await getBriefEmailLogMap();
  return map[String(scheduleId)] ?? null;
}

export async function markBriefEmailScheduled(scheduleId: number, input: { targetDate: string; sentAt: string; recipient: string }) {
  const map = await getBriefEmailLogMap();
  map[String(scheduleId)] = {
    ...(map[String(scheduleId)] ?? {}),
    scheduledTargetDate: input.targetDate,
    scheduledAt: input.sentAt,
    lastScheduledRecipient: input.recipient,
  };
  await saveBriefEmailLogMap(map);
}

export async function markBriefEmailManual(scheduleId: number, input: { sentAt: string; recipient: string }) {
  const map = await getBriefEmailLogMap();
  map[String(scheduleId)] = {
    ...(map[String(scheduleId)] ?? {}),
    lastManualAt: input.sentAt,
    lastManualRecipient: input.recipient,
  };
  await saveBriefEmailLogMap(map);
}

export async function getBriefLineLogEntry(scheduleId: number) {
  const map = await getBriefLineLogMap();
  return map[String(scheduleId)] ?? null;
}

export async function markBriefLineScheduled(
  scheduleId: number,
  input: {
    targetDate: string;
    sentAt: string;
    recipient: string | null;
    status: 'sent' | 'failed';
    error?: string | null;
  }
) {
  const map = await getBriefLineLogMap();
  map[String(scheduleId)] = {
    ...(map[String(scheduleId)] ?? {}),
    scheduledTargetDate: input.targetDate,
    scheduledAt: input.sentAt,
    lastScheduledRecipient: input.recipient,
    lastScheduledStatus: input.status,
    lastScheduledError: input.error ?? null,
  };
  await saveBriefLineLogMap(map);
}

export async function markBriefLineManual(
  scheduleId: number,
  input: {
    sentAt: string;
    recipient: string | null;
    status: 'sent' | 'failed';
    error?: string | null;
  }
) {
  const map = await getBriefLineLogMap();
  map[String(scheduleId)] = {
    ...(map[String(scheduleId)] ?? {}),
    lastManualAt: input.sentAt,
    lastManualRecipient: input.recipient,
    lastManualStatus: input.status,
    lastManualError: input.error ?? null,
  };
  await saveBriefLineLogMap(map);
}

export async function getBriefEmailEventsSince(since?: string | null) {
  const map = await getBriefEmailLogMap();
  const sinceTime = since ? new Date(since).getTime() : null;
  const events: BriefEmailNotificationEvent[] = [];

  for (const [scheduleId, entry] of Object.entries(map)) {
    if (entry.lastManualAt) {
      const sentAt = new Date(entry.lastManualAt).getTime();
      if (!sinceTime || sentAt > sinceTime) {
        events.push({
          scheduleId: Number(scheduleId),
          mode: 'manual',
          sentAt: entry.lastManualAt,
          recipient: entry.lastManualRecipient ?? null,
        });
      }
    }

    if (entry.scheduledAt) {
      const sentAt = new Date(entry.scheduledAt).getTime();
      if (!sinceTime || sentAt > sinceTime) {
        events.push({
          scheduleId: Number(scheduleId),
          mode: 'scheduled',
          sentAt: entry.scheduledAt,
          recipient: entry.lastScheduledRecipient ?? null,
        });
      }
    }
  }

  return events.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

export function parseClientBriefConfigFormData(formData: FormData): ClientBriefConfig {
  return mergeClientBriefConfig({
    visitNoticeTime: String(formData.get('visit_notice_time') || ''),
    visitNotesJa: String(formData.get('guide_visit_notes_ja') || ''),
    publishNotesJa: String(formData.get('guide_publish_notes_ja') || ''),
    postNotesJa: String(formData.get('guide_post_notes_ja') || ''),
    shootNotesJa: String(formData.get('guide_shoot_notes_ja') || ''),
  });
}

export function parseDeliverySettingsFormData(formData: FormData): Partial<DeliverySettings> {
  const next: Partial<DeliverySettings> = {};
  const setString = (key: keyof DeliverySettings, formKey: string) => {
    if (formData.has(formKey)) {
      next[key] = String(formData.get(formKey) || '');
    }
  };

  setString('emailRecipient', 'email_recipient');
  setString('emailSender', 'email_sender');
  setString('lineChannelAccessToken', 'line_channel_access_token');
  setString('lineChannelSecret', 'line_channel_secret');
  setString('lineDestinationId', 'line_destination_id');
  setString('lineInfluencerMessageTemplate', 'line_influencer_message_template');
  setString('kakaoJavascriptKey', 'kakao_javascript_key');
  setString('kakaoRestApiKey', 'kakao_rest_api_key');
  setString('kakaoAdminKey', 'kakao_admin_key');
  setString('kakaoSenderKey', 'kakao_sender_key');
  setString('kakaoStoreMessageTemplate', 'kakao_store_message_template');

  return next;
}

export function splitGuideLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
}

export function renderTemplate(template: string, variables: JsonObject) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
    const value = variables[key];
    return value == null ? '' : String(value);
  });
}
