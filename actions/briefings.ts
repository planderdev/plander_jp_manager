'use server';

import { redirect } from 'next/navigation';
import { sendBriefingEmail } from '@/lib/briefing-email';

export async function sendBriefingEmailAction(formData: FormData) {
  const scheduleId = Number(formData.get('schedule_id'));
  const returnTo = String(formData.get('return_to') || `/campaigns/schedules/${scheduleId}/brief-preview`);

  if (!scheduleId) {
    throw new Error('schedule_id is required');
  }

  await sendBriefingEmail(scheduleId, 'manual');
  redirect(`${returnTo}?sent=1`);
}
