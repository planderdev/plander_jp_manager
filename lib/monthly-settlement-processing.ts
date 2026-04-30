import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  parseTransactionsFromOcrDocuments,
  readBankScreenshot,
  type MonthlySettlementOcrDocument,
  type MonthlySettlementTransaction,
} from '@/lib/bank-ocr';

type StoredReport = {
  id: number;
  screenshot_paths: string[] | null;
  processing_status: string | null;
};

async function downloadBankScreenshots(paths: string[]) {
  const admin = createAdminClient();
  const files: File[] = [];

  for (const path of paths) {
    const { data, error } = await admin.storage.from('payments').download(path);
    if (error) throw new Error(error.message);
    const bytes = await data.arrayBuffer();
    const fileName = path.split('/').pop() || 'bank-screenshot.jpg';
    files.push(new File([bytes], fileName, { type: data.type || 'image/jpeg' }));
  }

  return files;
}

async function buildOcrDocuments(paths: string[]) {
  const files = await downloadBankScreenshots(paths);
  const documents: MonthlySettlementOcrDocument[] = [];
  for (const file of files) {
    documents.push(await readBankScreenshot(file));
  }
  return documents;
}

export async function processMonthlySettlementReport(reportId: number) {
  const admin = createAdminClient();
  const { data: report, error } = await admin
    .from('monthly_settlement_reports')
    .select('id, screenshot_paths, processing_status')
    .eq('id', reportId)
    .single<StoredReport>();

  if (error) throw new Error(error.message);
  if (!report) throw new Error('보고서를 찾을 수 없습니다.');
  if (report.processing_status === 'done') return { status: 'done' as const };

  await admin
    .from('monthly_settlement_reports')
    .update({ processing_status: 'processing', processing_error: null })
    .eq('id', reportId);

  try {
    const screenshotPaths = report.screenshot_paths ?? [];
    if (!screenshotPaths.length) {
      await admin
        .from('monthly_settlement_reports')
        .update({
          processing_status: 'done',
          processing_error: null,
          transactions: [] satisfies MonthlySettlementTransaction[],
          ocr_documents: [] satisfies MonthlySettlementOcrDocument[],
        })
        .eq('id', reportId);
      return { status: 'done' as const };
    }

    const ocrDocuments = await buildOcrDocuments(screenshotPaths);
    const transactions = parseTransactionsFromOcrDocuments(ocrDocuments);

    await admin
      .from('monthly_settlement_reports')
      .update({
        processing_status: 'done',
        processing_error: null,
        transactions,
        ocr_documents: ocrDocuments,
      })
      .eq('id', reportId);

    return { status: 'done' as const, transactions: transactions.length };
  } catch (processError: any) {
    await admin
      .from('monthly_settlement_reports')
      .update({
        processing_status: 'error',
        processing_error: processError?.message ?? 'OCR 처리 중 오류가 발생했습니다.',
      })
      .eq('id', reportId);
    throw processError;
  }
}
