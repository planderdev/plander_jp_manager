'use server';

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

function reportTitle(yearMonth: string, locale: 'ko' | 'ja') {
  const [year, month] = yearMonth.split('-').map(Number);
  if (locale === 'ja') return `${year}年${month}月 レポート`;
  return `${year}년 ${month}월 보고서`;
}

function redirectToManager(clientId: number, yearMonth: string) {
  redirect(`/extras/report-links?client=${clientId}&month=${encodeURIComponent(yearMonth)}`);
}

export async function createSharedReportAction(formData: FormData) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const clientId = Number(formData.get('client_id'));
  const yearMonth = String(formData.get('year_month') || '');
  const locale = String(formData.get('locale') || 'ko') as 'ko' | 'ja';
  if (!clientId || !yearMonth) throw new Error('필수값 누락');

  const admin = createAdminClient();
  const token = crypto.randomBytes(16).toString('hex');
  const title = reportTitle(yearMonth, locale);

  const { data, error } = await admin
    .from('shared_reports')
    .upsert(
      {
        client_id: clientId,
        year_month: yearMonth,
        title,
        share_token: token,
      },
      { onConflict: 'client_id,year_month' }
    )
    .select('id, share_token')
    .single();

  if (error) throw new Error(error.message);

  if (!data?.share_token) throw new Error('공유 링크 생성 실패');

  revalidatePath('/extras/report-links');
  redirectToManager(clientId, yearMonth);
}

export async function deleteSharedReportAction(id: number, clientId: number, yearMonth: string) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const admin = createAdminClient();
  const { error } = await admin.from('shared_reports').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/extras/report-links');
  redirectToManager(clientId, yearMonth);
}
