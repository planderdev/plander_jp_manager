'use server';

import crypto from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { setFlashMessage } from '@/lib/flash';
import {
  type MonthlySettlementTransaction,
} from '@/lib/bank-ocr';
import { monthlySettlementTitle } from '@/lib/monthly-settlement-report';

function redirectToManager(clientIds: number[], yearMonth: string) {
  const params = new URLSearchParams();
  clientIds.forEach((clientId) => params.append('client', String(clientId)));
  params.set('month', yearMonth);
  redirect(`/extras/monthly-settlement?${params.toString()}`);
}

async function compressScreenshot(file: File) {
  const input = Buffer.from(await file.arrayBuffer());
  const image = sharp(input, { failOn: 'none' });
  const metadata = await image.metadata();
  const width = Math.max(1, Math.round((metadata.width ?? 0) * 0.5));
  const height = Math.max(1, Math.round((metadata.height ?? 0) * 0.5));
  const ext = path.extname(file.name).toLowerCase();

  let buffer: Buffer;
  let type = file.type || 'image/jpeg';
  if (ext === '.png' || file.type === 'image/png') {
    buffer = await image.resize(width || undefined, height || undefined).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    type = 'image/png';
  } else if (ext === '.webp' || file.type === 'image/webp') {
    buffer = await image.resize(width || undefined, height || undefined).webp({ quality: 80 }).toBuffer();
    type = 'image/webp';
  } else {
    buffer = await image.resize(width || undefined, height || undefined).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    type = 'image/jpeg';
  }

  return new File([new Uint8Array(buffer)], file.name, { type });
}

async function prepareScreenshots(files: File[]) {
  const prepared: File[] = [];
  for (const file of files) {
    prepared.push(await compressScreenshot(file));
  }
  return prepared;
}

async function uploadScreenshots(token: string, section: 'bank' | 'transfer', files: File[]) {
  const admin = createAdminClient();
  const uploadedPaths: string[] = [];

  for (const file of files) {
    const uploadPath = `monthly-settlement-reports/${token}/${section}/${Date.now()}_${file.name}`;
    const { error } = await admin.storage.from('payments').upload(uploadPath, file, { upsert: false });
    if (error) throw new Error(error.message);
    uploadedPaths.push(uploadPath);
  }

  return uploadedPaths;
}

export async function createMonthlySettlementReportAction(formData: FormData) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const clientIds = Array.from(new Set(formData.getAll('client_ids').map(Number).filter(Boolean)));
  const yearMonth = String(formData.get('year_month') || '');
  const bankScreenshotFiles = formData
    .getAll('bank_screenshots')
    .filter((item): item is File => item instanceof File && item.size > 0);
  const transferProofFiles = formData
    .getAll('transfer_proofs')
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (!clientIds.length || !yearMonth) {
    throw new Error('필수값이 누락되었습니다.');
  }
  if (transferProofFiles.length > 3) {
    throw new Error('실 송금내역 캡처는 최대 3장까지 업로드할 수 있습니다.');
  }
  if (bankScreenshotFiles.length > 3) {
    throw new Error('입출금 내역 캡처는 최대 3장까지 업로드할 수 있습니다.');
  }

  const token = crypto.randomBytes(16).toString('hex');
  const compressedBankScreenshots = await prepareScreenshots(bankScreenshotFiles);
  const compressedTransferProofs = await prepareScreenshots(transferProofFiles);
  const screenshotPaths = await uploadScreenshots(token, 'bank', compressedBankScreenshots);
  const transferProofPaths = await uploadScreenshots(token, 'transfer', compressedTransferProofs);
  const shouldProcess = screenshotPaths.length > 0;
  const transactions: MonthlySettlementTransaction[] = [];

  const admin = createAdminClient();
  const { error } = await admin.from('monthly_settlement_reports').insert({
    client_ids: clientIds,
    year_month: yearMonth,
    title: monthlySettlementTitle(yearMonth),
    share_token: token,
    screenshot_paths: screenshotPaths,
    transfer_proof_paths: transferProofPaths,
    transactions,
    ocr_documents: [],
    processing_status: shouldProcess ? 'pending' : 'done',
    processing_error: null,
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
    .select('screenshot_paths, transfer_proof_paths')
    .eq('id', id)
    .single();
  if (reportError) throw new Error(reportError.message);

  const removablePaths = [
    ...(report?.screenshot_paths ?? []),
    ...(report?.transfer_proof_paths ?? []),
  ];

  if (removablePaths.length) {
    await admin.storage.from('payments').remove(removablePaths);
  }

  const { error } = await admin.from('monthly_settlement_reports').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await setFlashMessage({ title: '작업 완료', body: '월말 결산보고 링크가 삭제되었습니다.' });
  revalidatePath('/extras/monthly-settlement');
  redirectToManager(clientIds, yearMonth);
}
