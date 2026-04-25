'use server';

import { redirect } from 'next/navigation';
import { sendBriefingEmail, sendBriefingLine } from '@/lib/briefing-email';

function withResultParam(returnTo: string, key: string, value: string) {
  const separator = returnTo.includes('?') ? '&' : '?';
  return `${returnTo}${separator}${key}=${value}`;
}

export async function sendBriefingEmailAction(formData: FormData) {
  const scheduleId = Number(formData.get('schedule_id'));
  const returnTo = String(formData.get('return_to') || `/campaigns/schedules/${scheduleId}/brief-preview`);

  if (!scheduleId) {
    throw new Error('schedule_id is required');
  }

  try {
    await sendBriefingEmail(scheduleId, 'manual');
    redirect(withResultParam(returnTo, 'sent', '1'));
  } catch (error: any) {
    const message = encodeURIComponent(error?.message ?? '메일 전송에 실패했습니다');
    redirect(withResultParam(returnTo, 'email_error', message));
  }
}

export async function sendBriefingLineAction(formData: FormData) {
  const scheduleId = Number(formData.get('schedule_id'));
  const returnTo = String(formData.get('return_to') || `/campaigns/schedules/${scheduleId}`);

  if (!scheduleId) {
    throw new Error('schedule_id is required');
  }

  try {
    await sendBriefingLine(scheduleId, 'manual');
    redirect(withResultParam(returnTo, 'line_sent', '1'));
  } catch (error: any) {
    const message = encodeURIComponent(error?.message ?? 'LINE 전송에 실패했습니다');
    redirect(withResultParam(returnTo, 'line_error', message));
  }
}
