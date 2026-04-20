import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { formatInviteDate, getBriefScheduleData } from '@/lib/briefing';
import {
  getBriefEmailLogEntry,
  getClientBriefConfigMap,
  getDeliverySettings,
  markBriefEmailManual,
  markBriefEmailScheduled,
} from '@/lib/briefing-config';

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

function tomorrowRange(date = new Date()) {
  const now = krDateParts(date);
  const base = new Date(`${now.year}-${now.month}-${now.day}T00:00:00+09:00`);
  const tomorrow = new Date(base.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(base.getTime() + 48 * 60 * 60 * 1000);
  const toYmd = (value: Date) => {
    const parts = krDateParts(value);
    return `${parts.year}-${parts.month}-${parts.day}`;
  };

  return {
    targetDate: toYmd(tomorrow),
    start: `${toYmd(tomorrow)}T00:00:00+09:00`,
    end: `${toYmd(dayAfter)}T00:00:00+09:00`,
    currentTime: `${now.hour}:${now.minute}`,
  };
}

function getAppBaseUrl() {
  return process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://plander-jp-manager.vercel.app';
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

  const { targetDate } = tomorrowRange();
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

  return { recipient, subject, visitAt };
}

export async function runScheduledBriefingEmails(now = new Date()) {
  const { start, end, targetDate, currentTime } = tomorrowRange(now);
  const sb = createAdminClient();
  const clientBriefConfigMap = await getClientBriefConfigMap();
  const { data: schedules, error } = await sb
    .from('schedules')
    .select('id, client_id, scheduled_at')
    .gte('scheduled_at', start)
    .lt('scheduled_at', end)
    .order('scheduled_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  let sent = 0;
  let skipped = 0;
  const results: Array<{ scheduleId: number; status: string; reason?: string }> = [];

  for (const schedule of schedules ?? []) {
    const clientConfig = clientBriefConfigMap[String(schedule.client_id)];
    const targetTime = clientConfig?.visitNoticeTime || '18:00';
    if (targetTime !== currentTime) {
      skipped += 1;
      results.push({ scheduleId: schedule.id, status: 'skipped', reason: `time_mismatch:${targetTime}` });
      continue;
    }

    const logEntry = await getBriefEmailLogEntry(schedule.id);
    if (logEntry?.scheduledTargetDate === targetDate) {
      skipped += 1;
      results.push({ scheduleId: schedule.id, status: 'skipped', reason: 'already_sent' });
      continue;
    }

    await sendBriefingEmail(schedule.id, 'scheduled');
    sent += 1;
    results.push({ scheduleId: schedule.id, status: 'sent' });
  }

  return {
    targetDate,
    currentTime,
    total: schedules?.length ?? 0,
    sent,
    skipped,
    results,
  };
}
