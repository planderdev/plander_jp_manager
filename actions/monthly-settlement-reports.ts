'use server';

import crypto from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { setFlashMessage } from '@/lib/flash';
import type { MonthlySettlementTransaction } from '@/lib/bank-ocr';
import { monthlySettlementTitle } from '@/lib/monthly-settlement-report';

function redirectToManager(clientIds: number[], yearMonth: string) {
  const params = new URLSearchParams();
  clientIds.forEach((clientId) => params.append('client', String(clientId)));
  params.set('month', yearMonth);
  redirect(`/extras/monthly-settlement?${params.toString()}`);
}

async function compressScreenshot(
  file: File,
  mode: 'preserve' | 'half',
) {
  const input = Buffer.from(await file.arrayBuffer());
  const image = sharp(input, { failOn: 'none' });
  const metadata = await image.metadata();
  const width = mode === 'half' ? Math.max(1, Math.round((metadata.width ?? 0) * 0.5)) : undefined;
  const height = mode === 'half' ? Math.max(1, Math.round((metadata.height ?? 0) * 0.5)) : undefined;
  const ext = path.extname(file.name).toLowerCase();

  let buffer: Buffer;
  let type = file.type || 'image/jpeg';
  if (ext === '.png' || file.type === 'image/png') {
    buffer = await image
      .resize(width, height)
      .png({ compressionLevel: mode === 'half' ? 9 : 6, adaptiveFiltering: true })
      .toBuffer();
    type = 'image/png';
  } else if (ext === '.webp' || file.type === 'image/webp') {
    buffer = await image
      .resize(width, height)
      .webp({ quality: mode === 'half' ? 80 : 92 })
      .toBuffer();
    type = 'image/webp';
  } else {
    buffer = await image
      .resize(width, height)
      .jpeg({ quality: mode === 'half' ? 80 : 92, mozjpeg: true })
      .toBuffer();
    type = 'image/jpeg';
  }

  return new File([new Uint8Array(buffer)], file.name, { type });
}

async function prepareScreenshots(files: File[], mode: 'preserve' | 'half') {
  const prepared: File[] = [];
  for (const file of files) {
    prepared.push(await compressScreenshot(file, mode));
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

function parseTransactionsJson(raw: string): MonthlySettlementTransaction[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.reduce<MonthlySettlementTransaction[]>((items, entry, index) => {
    if (!entry || typeof entry !== 'object') return items;

    const record = entry as Record<string, unknown>;
    const direction = record.direction === 'incoming' ? 'incoming' : 'outgoing';
    const amountValue = Number(record.amount ?? 0);
    const memo = String(record.memo ?? '').trim() || '메모 없음';
    const happenedAt = record.happenedAt ? String(record.happenedAt).trim() : null;
    if (!Number.isFinite(amountValue) || amountValue <= 0) return items;

    items.push({
      id: String(record.id ?? `manual-${index}-${amountValue}`),
      direction,
      amount: amountValue,
      memo,
      rawText: `${direction === 'incoming' ? '입금' : '출금'} | ${amountValue} | ${memo} | ${happenedAt ?? ''}`,
      happenedAt,
      sourceName: 'manual',
    });

    return items;
  }, []);
}

function sanitizeKeptPaths(values: FormDataEntryValue[], originals: string[]) {
  const originalSet = new Set(originals);
  return Array.from(
    new Set(
      values
        .map((value) => String(value))
        .filter((value) => originalSet.has(value)),
    ),
  );
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
  const manualTransactions = parseTransactionsJson(String(formData.get('transactions_json') || '[]'));

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
  const compressedBankScreenshots = await prepareScreenshots(bankScreenshotFiles, 'preserve');
  const compressedTransferProofs = await prepareScreenshots(transferProofFiles, 'half');
  const screenshotPaths = await uploadScreenshots(token, 'bank', compressedBankScreenshots);
  const transferProofPaths = await uploadScreenshots(token, 'transfer', compressedTransferProofs);

  const admin = createAdminClient();
  const { error } = await admin.from('monthly_settlement_reports').insert({
    client_ids: clientIds,
    year_month: yearMonth,
    title: monthlySettlementTitle(yearMonth),
    share_token: token,
    screenshot_paths: screenshotPaths,
    transfer_proof_paths: transferProofPaths,
    transactions: manualTransactions,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  await setFlashMessage({ title: '작업 완료', body: '월말 결산보고 링크가 생성되었습니다.' });
  revalidatePath('/extras/monthly-settlement');
  redirectToManager(clientIds, yearMonth);
}

export async function updateMonthlySettlementReportAction(id: number, formData: FormData) {
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
  const transactions = parseTransactionsJson(String(formData.get('transactions_json') || '[]'));

  if (!clientIds.length || !yearMonth) {
    throw new Error('필수값이 누락되었습니다.');
  }

  const admin = createAdminClient();
  const { data: report, error: reportError } = await admin
    .from('monthly_settlement_reports')
    .select('share_token, screenshot_paths, transfer_proof_paths')
    .eq('id', id)
    .single();
  if (reportError || !report) throw new Error(reportError?.message ?? '보고서를 찾을 수 없습니다.');

  const keptScreenshotPaths = sanitizeKeptPaths(
    formData.getAll('keep_bank_screenshots_paths'),
    report.screenshot_paths ?? [],
  );
  const keptTransferProofPaths = sanitizeKeptPaths(
    formData.getAll('keep_transfer_proofs_paths'),
    report.transfer_proof_paths ?? [],
  );

  if (keptScreenshotPaths.length + bankScreenshotFiles.length > 3) {
    throw new Error('입출금 내역 캡처는 최대 3장까지 업로드할 수 있습니다.');
  }
  if (keptTransferProofPaths.length + transferProofFiles.length > 3) {
    throw new Error('실 송금내역 캡처는 최대 3장까지 업로드할 수 있습니다.');
  }

  const compressedBankScreenshots = await prepareScreenshots(bankScreenshotFiles, 'preserve');
  const compressedTransferProofs = await prepareScreenshots(transferProofFiles, 'half');
  const uploadedScreenshotPaths = await uploadScreenshots(report.share_token, 'bank', compressedBankScreenshots);
  const uploadedTransferProofPaths = await uploadScreenshots(report.share_token, 'transfer', compressedTransferProofs);

  const removedPaths = [
    ...(report.screenshot_paths ?? []).filter((path: string) => !keptScreenshotPaths.includes(path)),
    ...(report.transfer_proof_paths ?? []).filter((path: string) => !keptTransferProofPaths.includes(path)),
  ];
  if (removedPaths.length) {
    await admin.storage.from('payments').remove(removedPaths);
  }

  const { error } = await admin
    .from('monthly_settlement_reports')
    .update({
      client_ids: clientIds,
      year_month: yearMonth,
      title: monthlySettlementTitle(yearMonth),
      screenshot_paths: [...keptScreenshotPaths, ...uploadedScreenshotPaths],
      transfer_proof_paths: [...keptTransferProofPaths, ...uploadedTransferProofPaths],
      transactions,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  await setFlashMessage({ title: '작업 완료', body: '월말 결산보고가 저장되었습니다.' });
  revalidatePath('/extras/monthly-settlement');
  revalidatePath(`/extras/monthly-settlement/${id}`);
  revalidatePath(`/settlement-report/${report.share_token}`);
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
