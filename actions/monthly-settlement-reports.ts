'use server';

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { setFlashMessage } from '@/lib/flash';
import {
  parseTransactionsFromOcrDocuments,
  readBankScreenshot,
  type MonthlySettlementOcrDocument,
  type MonthlySettlementTransaction,
} from '@/lib/bank-ocr';
import { monthlySettlementTitle } from '@/lib/monthly-settlement-report';

function redirectToManager(clientIds: number[], yearMonth: string) {
  const params = new URLSearchParams();
  clientIds.forEach((clientId) => params.append('client', String(clientId)));
  params.set('month', yearMonth);
  redirect(`/extras/monthly-settlement?${params.toString()}`);
}

async function uploadScreenshots(token: string, files: File[]) {
  const admin = createAdminClient();
  const uploadedPaths: string[] = [];

  for (const file of files) {
    const path = `monthly-settlement-reports/${token}/${Date.now()}_${file.name}`;
    const { error } = await admin.storage.from('payments').upload(path, file, { upsert: false });
    if (error) throw new Error(error.message);
    uploadedPaths.push(path);
  }

  return uploadedPaths;
}

async function readScreenshots(files: File[]) {
  const documents: MonthlySettlementOcrDocument[] = [];
  for (const file of files) {
    documents.push(await readBankScreenshot(file));
  }
  return documents;
}

export async function createMonthlySettlementReportAction(formData: FormData) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const clientIds = Array.from(new Set(formData.getAll('client_ids').map(Number).filter(Boolean)));
  const yearMonth = String(formData.get('year_month') || '');
  const screenshotFiles = formData
    .getAll('screenshots')
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (!clientIds.length || !yearMonth) {
    throw new Error('필수값이 누락되었습니다.');
  }

  const token = crypto.randomBytes(16).toString('hex');
  const ocrDocuments = await readScreenshots(screenshotFiles);
  const screenshotPaths = await uploadScreenshots(token, screenshotFiles);
  const transactions: MonthlySettlementTransaction[] = parseTransactionsFromOcrDocuments(ocrDocuments);

  const admin = createAdminClient();
  const { error } = await admin.from('monthly_settlement_reports').insert({
    client_ids: clientIds,
    year_month: yearMonth,
    title: monthlySettlementTitle(yearMonth),
    share_token: token,
    screenshot_paths: screenshotPaths,
    transactions,
    ocr_documents: ocrDocuments,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  await setFlashMessage({ title: '작업 완료', body: '월말 결산보고 링크가 생성되었습니다.' });
  revalidatePath('/extras/monthly-settlement');
  redirectToManager(clientIds, yearMonth);
}

export async function deleteMonthlySettlementReportAction(id: number, clientIds: number[], yearMonth: string) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const admin = createAdminClient();
  const { data: report, error: reportError } = await admin
    .from('monthly_settlement_reports')
    .select('screenshot_paths')
    .eq('id', id)
    .single();
  if (reportError) throw new Error(reportError.message);

  if (report?.screenshot_paths?.length) {
    await admin.storage.from('payments').remove(report.screenshot_paths);
  }

  const { error } = await admin.from('monthly_settlement_reports').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await setFlashMessage({ title: '작업 완료', body: '월말 결산보고 링크가 삭제되었습니다.' });
  revalidatePath('/extras/monthly-settlement');
  redirectToManager(clientIds, yearMonth);
}
