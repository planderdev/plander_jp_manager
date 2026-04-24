import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { formatInviteDate, getBriefScheduleData } from '@/lib/briefing';
import {
  getBriefEmailLogEntry,
  getBriefLineLogEntry,
  getDeliverySettings,
  markBriefEmailManual,
  markBriefEmailScheduled,
  markBriefLineManual,
  markBriefLineScheduled,
  renderTemplate,
} from '@/lib/briefing-config';
import { sendWebPushNotification } from '@/lib/web-push';

type SendMode = 'manual' | 'scheduled';

function krDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') {
      parts[part.type] = part.value;
    }
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour === '24' ? '00' : parts.hour,
    minute: parts.minute,
  };
}

function briefingTargetRange(date = new Date()) {
  const now = krDateParts(date);
  const base = new Date(`${now.year}-${now.month}-${now.day}T00:00:00+09:00`);
  const target = new Date(base.getTime() + 48 * 60 * 60 * 1000);
  const nextDay = new Date(base.getTime() + 72 * 60 * 60 * 1000);
  const toYmd = (value: Date) => {
    const parts = krDateParts(value);
    return `${parts.year}-${parts.month}-${parts.day}`;
  };

  return {
    targetDate: toYmd(target),
    start: `${toYmd(target)}T00:00:00+09:00`,
    end: `${toYmd(nextDay)}T00:00:00+09:00`,
    currentTime: `${now.hour}:${now.minute}`,
  };
}

function lineTargetRange(date = new Date()) {
  const now = krDateParts(date);
  const base = new Date(`${now.year}-${now.month}-${now.day}T00:00:00+09:00`);
  const target = new Date(base.getTime() + 24 * 60 * 60 * 1000);
  const nextDay = new Date(base.getTime() + 48 * 60 * 60 * 1000);
  const toYmd = (value: Date) => {
    const parts = krDateParts(value);
    return `${parts.year}-${parts.month}-${parts.day}`;
  };

  return {
    targetDate: toYmd(target),
    start: `${toYmd(target)}T00:00:00+09:00`,
    end: `${toYmd(nextDay)}T00:00:00+09:00`,
    currentTime: `${now.hour}:${now.minute}`,
  };
}

function getAppBaseUrl() {
  return process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://plander-jp-manager.vercel.app';
}

function formatVisitDateParts(value: string) {
  const parts = krDateParts(new Date(value));
  return {
    visitDate: `${parts.year}.${parts.month}.${parts.day}`,
    visitTime: `${parts.hour}:${parts.minute}`,
  };
}

function isTimeReached(currentTime: string, scheduledTime: string) {
  return currentTime >= scheduledTime;
}

function dayDiffLabel(targetDate: string, now = new Date()) {
  const nowParts = krDateParts(now);
  const today = new Date(`${nowParts.year}-${nowParts.month}-${nowParts.day}T00:00:00+09:00`);
  const target = new Date(`${targetDate}T00:00:00+09:00`);
  const diff = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  return {
    ko: diff <= 1 ? '내일' : `${diff}일 후`,
    ja: diff <= 1 ? '明日' : `${diff}日後`,
  };
}

async function sendResendEmail(payload: Record<string, unknown>, idempotencyKey: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is missing');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.message ?? 'Resend email send failed');
  }

  return json;
}

async function fetchAttachment(url: string, fallbackFilename: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`이미지 생성 실패: ${fallbackFilename}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    filename: fallbackFilename,
    content: Buffer.from(arrayBuffer).toString('base64'),
    contentType: response.headers.get('content-type') || 'image/png',
  };
}

async function sendLinePush({
  accessToken,
  to,
  messages,
}: {
  accessToken: string;
  to: string;
  messages: Array<Record<string, unknown>>;
}) {
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, messages }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || 'LINE push send failed');
  }
}

export async function sendBriefingEmail(scheduleId: number, mode: SendMode = 'manual') {
  const brief = await getBriefScheduleData(scheduleId);
  if (!brief) {
    throw new Error('스케줄 정보를 찾을 수 없습니다');
  }

  const deliverySettings = await getDeliverySettings();
  const recipient = deliverySettings.emailRecipient || '1986desire@gmail.com';
  const sender = deliverySettings.emailSender || 'Plander <onboarding@resend.dev>';
  const baseUrl = getAppBaseUrl().replace(/\/$/, '');
  const invitationUrl = `${baseUrl}/campaigns/schedules/${scheduleId}/brief-preview/invitation.png`;
  const guideUrl = `${baseUrl}/campaigns/schedules/${scheduleId}/brief-preview/guide.png`;
  const subject = `[Plander] ${brief.clientName} @${brief.influencerHandle} 초대장/가이드`;
  const visitAt = formatInviteDate(brief.scheduledAt);

  const { targetDate } = briefingTargetRange();
  const [invitationAttachment, guideAttachment] = await Promise.all([
    fetchAttachment(invitationUrl, `invitation-${scheduleId}.png`),
    fetchAttachment(guideUrl, `guide-${scheduleId}.png`),
  ]);
  await sendResendEmail({
    from: sender,
    to: [recipient],
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2 style="margin:0 0 12px">초대장 / 가이드 자동 발송</h2>
        <p style="margin:0 0 16px">${brief.clientName} · @${brief.influencerHandle} · ${visitAt}</p>
        <p style="margin:0 0 20px">첨부파일로도 함께 넣어두었습니다.</p>
        <div style="margin:0 0 20px">
          <img src="cid:invitation-image" alt="Invitation" style="max-width:100%;border-radius:18px;display:block" />
        </div>
        <div>
          <img src="cid:guide-image" alt="Guide" style="max-width:100%;border-radius:18px;display:block" />
        </div>
      </div>
    `,
    attachments: [
      {
        ...invitationAttachment,
        contentId: 'invitation-image',
      },
      {
        ...guideAttachment,
        contentId: 'guide-image',
      },
    ],
  }, `brief-${mode}-${scheduleId}-${mode === 'scheduled' ? targetDate : Date.now()}`);

  const sentAt = new Date().toISOString();
  if (mode === 'scheduled') {
    await markBriefEmailScheduled(scheduleId, { targetDate, sentAt, recipient });
  } else {
    await markBriefEmailManual(scheduleId, { sentAt, recipient });
  }

  if (mode === 'manual') {
    await sendWebPushNotification((locale) => ({
      title: locale === 'ja' ? '招待状/ガイドメール送信完了' : '초대장/가이드 메일 전송 완료',
      body:
        locale === 'ja'
          ? `${brief.clientName} / @${brief.influencerHandle} の送信が完了しました。`
          : `${brief.clientName} / @${brief.influencerHandle} 전송이 완료되었습니다.`,
      url: '/extras/admins',
      tag: `brief-email-${scheduleId}`,
    }));
  }

  return { recipient, subject, visitAt };
}

export async function sendBriefingLine(scheduleId: number, mode: SendMode = 'manual') {
  const brief = await getBriefScheduleData(scheduleId);
  if (!brief) {
    throw new Error('스케줄 정보를 찾을 수 없습니다');
  }

  if (!brief.lineUserId) {
    throw new Error('LINE ID가 연결되지 않았습니다');
  }

  const deliverySettings = await getDeliverySettings();
  if (!deliverySettings.lineChannelAccessToken) {
    throw new Error('LINE Channel Access Token이 설정되지 않았습니다');
  }

  const baseUrl = getAppBaseUrl().replace(/\/$/, '');
  const invitationUrl = `${baseUrl}/campaigns/schedules/${scheduleId}/brief-preview/invitation.png`;
  const guideUrl = `${baseUrl}/campaigns/schedules/${scheduleId}/brief-preview/guide.png`;
  const { visitDate, visitTime } = formatVisitDateParts(brief.scheduledAt);
  const text = renderTemplate(deliverySettings.lineInfluencerMessageTemplate, {
    influencerHandle: `@${brief.influencerHandle}`,
    visitDate,
    visitTime,
    clientName: brief.clientName,
    storeNameJa: brief.storeNameJa,
  });

  await sendLinePush({
    accessToken: deliverySettings.lineChannelAccessToken,
    to: brief.lineUserId,
    messages: [
      {
        type: 'image',
        originalContentUrl: guideUrl,
        previewImageUrl: guideUrl,
      },
      {
        type: 'image',
        originalContentUrl: invitationUrl,
        previewImageUrl: invitationUrl,
      },
      {
        type: 'text',
        text,
      },
    ],
  });

  const sentAt = new Date().toISOString();
  if (mode === 'manual') {
    await markBriefLineManual(scheduleId, {
      sentAt,
      recipient: brief.lineUserId,
      status: 'sent',
    });
    await sendWebPushNotification((locale) => ({
      title: locale === 'ja' ? 'LINE案内送信完了' : 'LINE 안내 전송 완료',
      body:
        locale === 'ja'
          ? `${brief.clientName} / @${brief.influencerHandle} 送信に成功しました。`
          : `${brief.clientName} / @${brief.influencerHandle} 전송에 성공했어.`,
      url: '/extras/line-contacts',
      tag: `brief-line-${scheduleId}`,
    }));
  }

  return {
    recipient: brief.lineUserId,
    visitDate,
    visitTime,
  };
}

export async function runScheduledBriefingEmails(now = new Date()) {
  const { start, end, targetDate, currentTime } = briefingTargetRange(now);
  const sb = createAdminClient();
  const { data: schedules, error } = await sb
    .from('schedules')
    .select('id, client_id, scheduled_at')
    .gte('scheduled_at', start)
    .lt('scheduled_at', end)
    .order('scheduled_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!isTimeReached(currentTime, '12:00')) {
    return {
      targetDate,
      currentTime,
      total: schedules?.length ?? 0,
      sent: 0,
      failed: 0,
      skipped: schedules?.length ?? 0,
      results: (schedules ?? []).map((schedule) => ({
        scheduleId: schedule.id,
        status: 'skipped',
        reason: 'before_send_time',
      })),
    };
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const results: Array<{ scheduleId: number; status: string; reason?: string }> = [];

  for (const schedule of schedules ?? []) {
    const logEntry = await getBriefEmailLogEntry(schedule.id);
    if (logEntry?.scheduledTargetDate === targetDate) {
      skipped += 1;
      results.push({ scheduleId: schedule.id, status: 'skipped', reason: 'already_sent' });
      continue;
    }

    try {
      await sendBriefingEmail(schedule.id, 'scheduled');
      sent += 1;
      results.push({ scheduleId: schedule.id, status: 'sent' });
    } catch (error: any) {
      failed += 1;
      results.push({
        scheduleId: schedule.id,
        status: 'failed',
        reason: error?.message ?? 'send_failed',
      });
    }
  }

  if (sent > 0 || failed > 0) {
    const label = dayDiffLabel(targetDate, now);
    await sendWebPushNotification((locale) => ({
      title: locale === 'ja' ? '招待状/ガイド自動送信結果' : '초대장/가이드 자동발송 결과',
      body:
        locale === 'ja'
          ? `${label.ja} メール 성공 ${sent}件 / 실패 ${failed}件`
          : `${label.ko} 메일 성공 ${sent}건 / 실패 ${failed}건`,
      url: '/campaigns/schedules',
      tag: `scheduled-brief-${targetDate}`,
    }));
  }

  return {
    targetDate,
    currentTime,
    total: schedules?.length ?? 0,
    sent,
    failed,
    skipped,
    results,
  };
}

export async function runScheduledBriefingLineMessages(now = new Date()) {
  const { start, end, targetDate, currentTime } = lineTargetRange(now);
  const sb = createAdminClient();
  const deliverySettings = await getDeliverySettings();

  if (!deliverySettings.lineChannelAccessToken) {
    await sendWebPushNotification((locale) => ({
      title: locale === 'ja' ? 'LINE自動送信失敗' : 'LINE 자동발송 실패',
      body:
        locale === 'ja'
          ? 'LINE Channel Access Token が未設定です。'
          : 'LINE Channel Access Token이 비어 있어서 발송을 못 했어.',
      url: '/extras/admins',
      tag: `scheduled-line-missing-token-${targetDate}`,
    }));

    return {
      targetDate,
      currentTime,
      total: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      results: [],
      reason: 'missing_line_token',
    };
  }

  const { data: schedules, error } = await sb
    .from('schedules')
    .select('id')
    .gte('scheduled_at', start)
    .lt('scheduled_at', end)
    .order('scheduled_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const results: Array<{ scheduleId: number; status: string; reason?: string }> = [];

  for (const schedule of schedules ?? []) {
    const brief = await getBriefScheduleData(schedule.id);
    if (!brief) {
      failed += 1;
      results.push({ scheduleId: schedule.id, status: 'failed', reason: 'missing_brief_data' });
      continue;
    }

    if (!isTimeReached(currentTime, brief.visitNoticeTime)) {
      skipped += 1;
      results.push({ scheduleId: schedule.id, status: 'skipped', reason: 'before_notice_time' });
      continue;
    }

    const logEntry = await getBriefLineLogEntry(schedule.id);
    if (logEntry?.scheduledTargetDate === targetDate) {
      skipped += 1;
      results.push({ scheduleId: schedule.id, status: 'skipped', reason: 'already_sent' });
      continue;
    }

    try {
      const result = await sendBriefingLine(schedule.id, 'scheduled');
      await markBriefLineScheduled(schedule.id, {
        targetDate,
        sentAt: new Date().toISOString(),
        recipient: result.recipient,
        status: 'sent',
      });
      sent += 1;
      results.push({ scheduleId: schedule.id, status: 'sent' });
    } catch (error: any) {
      const errorMessage = error?.message ?? 'send_failed';
      await markBriefLineScheduled(schedule.id, {
        targetDate,
        sentAt: new Date().toISOString(),
        recipient: brief.lineUserId,
        status: 'failed',
        error: errorMessage,
      });
      failed += 1;
      results.push({ scheduleId: schedule.id, status: 'failed', reason: errorMessage });
    }
  }

  if (sent > 0 || failed > 0) {
    await sendWebPushNotification((locale) => ({
      title: locale === 'ja' ? 'LINE自動送信結果' : 'LINE 자동발송 결과',
      body:
        locale === 'ja'
          ? `明日 LINE 성공 ${sent}件 / 실패 ${failed}件`
          : `내일 LINE 성공 ${sent}건 / 실패 ${failed}건`,
      url: '/extras/line-contacts',
      tag: `scheduled-line-${targetDate}`,
    }));
  }

  return {
    targetDate,
    currentTime,
    total: schedules?.length ?? 0,
    sent,
    failed,
    skipped,
    results,
  };
}
