'use server';

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { setFlashMessage } from '@/lib/flash';

function reportTitle(yearMonth: string, locale: 'ko' | 'ja') {
  const [year, month] = yearMonth.split('-').map(Number);
  if (locale === 'ja') return `${year}年${month}月 レポート`;
  return `${year}년 ${month}월 보고서`;
}

function redirectToManager(clientIds: number[], yearMonth: string) {
  const params = new URLSearchParams();
  clientIds.forEach((clientId) => params.append('client', String(clientId)));
  params.set('month', yearMonth);
  redirect(`/extras/report-links?${params.toString()}`);
}

function redirectToPaymentManager(input: {
  clientId?: number | null;
  influencerId?: number | null;
  fromDate?: string | null;
  toDate?: string | null;
}) {
  const params = new URLSearchParams();
  if (input.clientId) params.set('client', String(input.clientId));
  if (input.influencerId) params.set('influencer', String(input.influencerId));
  if (input.fromDate) params.set('from', input.fromDate);
  if (input.toDate) params.set('to', input.toDate);
  redirect(`/extras/payment-reports${params.size ? `?${params.toString()}` : ''}`);
}

function paymentReportTitle(fromDate: string | null, toDate: string | null) {
  if (fromDate && toDate) return `${fromDate} ~ ${toDate} 내부 결제 보고서`;
  if (fromDate) return `${fromDate} 이후 내부 결제 보고서`;
  if (toDate) return `${toDate} 이전 내부 결제 보고서`;
  return '전체 기간 내부 결제 보고서';
}

export async function createSharedReportAction(formData: FormData) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const clientIds = formData.getAll('client_ids').map(Number).filter(Boolean);
  const clientId = clientIds[0];
  const yearMonth = String(formData.get('year_month') || '');
  const locale = String(formData.get('locale') || 'ko') as 'ko' | 'ja';
  if (!clientIds.length || !yearMonth) throw new Error('필수값 누락');

  const admin = createAdminClient();
  const token = crypto.randomBytes(16).toString('hex');
  const title = reportTitle(yearMonth, locale);

  const { data, error } = await admin.from('shared_reports').insert({
    client_id: clientId,
    client_ids: clientIds,
    year_month: yearMonth,
    title,
    share_token: token,
  }).select('id, share_token').single();

  if (error) throw new Error(error.message);

  if (!data?.share_token) throw new Error('공유 링크 생성 실패');

  await setFlashMessage({ title: '작업 완료', body: '업체용 보고서 링크를 만들었어.' });
  revalidatePath('/extras/report-links');
  redirectToManager(clientIds, yearMonth);
}

export async function deleteSharedReportAction(id: number, clientIds: number[], yearMonth: string) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const admin = createAdminClient();
  const { error } = await admin.from('shared_reports').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await setFlashMessage({ title: '작업 완료', body: '업체용 보고서 링크를 삭제했어.' });
  revalidatePath('/extras/report-links');
  redirectToManager(clientIds, yearMonth);
}

export async function createInternalPaymentReportAction(formData: FormData) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const clientId = Number(formData.get('client_id')) || null;
  const influencerId = Number(formData.get('influencer_id')) || null;
  const fromDate = String(formData.get('from_date') || '') || null;
  const toDate = String(formData.get('to_date') || '') || null;

  const admin = createAdminClient();
  const token = crypto.randomBytes(16).toString('hex');
  const { error } = await admin.from('internal_payment_reports').insert({
    client_id: clientId,
    influencer_id: influencerId,
    from_date: fromDate,
    to_date: toDate,
    title: paymentReportTitle(fromDate, toDate),
    share_token: token,
  });

  if (error) throw new Error(error.message);

  await setFlashMessage({ title: '작업 완료', body: '내부 보고서 링크를 만들었어.' });
  revalidatePath('/extras/payment-reports');
  redirectToPaymentManager({ clientId, influencerId, fromDate, toDate });
}

export async function deleteInternalPaymentReportAction(
  id: number,
  input: { clientId?: number | null; influencerId?: number | null; fromDate?: string | null; toDate?: string | null }
) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const admin = createAdminClient();
  const { error } = await admin.from('internal_payment_reports').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await setFlashMessage({ title: '작업 완료', body: '내부 보고서 링크를 삭제했어.' });
  revalidatePath('/extras/payment-reports');
  redirectToPaymentManager(input);
}
