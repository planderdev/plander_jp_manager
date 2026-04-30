import { createAdminClient } from '@/lib/supabase/admin';
import type { MonthlySettlementOcrDocument, MonthlySettlementTransaction } from '@/lib/bank-ocr';

export type MonthlySettlementCompletedPost = {
  id: number;
  visitDate: string;
  storeName: string;
  influencerHandle: string;
  accountUrl: string | null;
  postUrl: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  unitPrice: number;
  settlementAmount: number;
  settlementStatus: 'payable' | 'done';
  settledOn: string | null;
};

export type MonthlySettlementReportData = {
  clients: Array<{ id: number; company_name: string }>;
  yearMonth: string;
  title: string;
  transactions: MonthlySettlementTransaction[];
  ocrDocuments: MonthlySettlementOcrDocument[];
  bankScreenshotImageUrls: Array<{ path: string; url: string }>;
  transferProofImageUrls: Array<{ path: string; url: string }>;
  completedPosts: MonthlySettlementCompletedPost[];
  processingStatus: 'pending' | 'processing' | 'done' | 'error';
  processingError: string | null;
  totals: {
    incoming: number;
    outgoing: number;
    net: number;
    completedPosts: number;
    settledPosts: number;
    payablePosts: number;
    transferProofCount: number;
  };
  createdAtLabel: string | null;
};

type ReportRecord = {
  transactions: MonthlySettlementTransaction[] | null;
  ocr_documents: MonthlySettlementOcrDocument[] | null;
  screenshot_paths?: string[] | null;
  transfer_proof_paths?: string[] | null;
  processing_status?: string | null;
  processing_error?: string | null;
  created_at?: string | null;
};

type PostRecord = {
  id: number;
  post_url: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  uploaded_on: string | null;
  created_at: string | null;
  settled_on: string | null;
  settlement_status: 'payable' | 'done' | 'pending' | null;
  clients: { company_name: string | null } | Array<{ company_name: string | null }> | null;
  influencers:
    | {
        handle: string | null;
        account_url: string | null;
        unit_price: number | null;
      }
    | Array<{
        handle: string | null;
        account_url: string | null;
        unit_price: number | null;
      }>
    | null;
  schedules:
    | {
        scheduled_at: string | null;
      }
    | Array<{
        scheduled_at: string | null;
      }>
    | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function resolveVisitDate(row: Pick<PostRecord, 'uploaded_on' | 'created_at' | 'schedules'>) {
  const schedule = first(row.schedules);
  return row.uploaded_on || schedule?.scheduled_at || row.created_at || null;
}

function inMonth(value: string | null, yearMonth: string) {
  return Boolean(value && value.slice(0, 7) === yearMonth);
}

function formatCreatedAtLabel(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

export function monthlySettlementTitle(yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number);
  return `${year}년 ${month}월 월말 결산보고`;
}

export async function getMonthlySettlementReportData(input: {
  clientIds: number[];
  yearMonth: string;
  report?: ReportRecord | null;
}): Promise<MonthlySettlementReportData> {
  const sb = createAdminClient();
  const ids = Array.from(new Set(input.clientIds.map(Number).filter(Boolean)));
  const [{ data: clients }, { data: posts }] = await Promise.all([
    sb.from('clients').select('id, company_name').in('id', ids).order('company_name'),
    sb.from('posts')
      .select(`
        id,
        post_url,
        views,
        likes,
        comments,
        shares,
        uploaded_on,
        created_at,
        settled_on,
        settlement_status,
        clients (company_name),
        influencers (handle, account_url, unit_price),
        schedules (scheduled_at)
      `)
      .in('client_id', ids)
      .in('settlement_status', ['payable', 'done'])
      .order('updated_at', { ascending: false }),
  ]);

  const completedPosts = ((posts ?? []) as unknown as PostRecord[])
    .filter((post) => inMonth(resolveVisitDate(post), input.yearMonth))
    .map((post) => {
      const client = first(post.clients);
      const influencer = first(post.influencers);
      return {
        id: post.id,
        visitDate: resolveVisitDate(post)?.slice(0, 10) ?? input.yearMonth,
        storeName: client?.company_name ?? '-',
        influencerHandle: influencer?.handle ?? '-',
        accountUrl: influencer?.account_url ?? null,
        postUrl: post.post_url ?? null,
        views: post.views ?? 0,
        likes: post.likes ?? 0,
        comments: post.comments ?? 0,
        shares: post.shares ?? 0,
        unitPrice: influencer?.unit_price ?? 0,
        settlementAmount: (influencer?.unit_price ?? 0) * 10,
        settlementStatus: post.settlement_status === 'done' ? 'done' : 'payable',
        settledOn: post.settled_on,
      } satisfies MonthlySettlementCompletedPost;
    });

  const transactions = input.report?.transactions ?? [];
  const incoming = transactions
    .filter((item) => item.direction === 'incoming')
    .reduce((sum, item) => sum + item.amount, 0);
  const outgoing = transactions
    .filter((item) => item.direction === 'outgoing')
    .reduce((sum, item) => sum + item.amount, 0);
  const transferProofPaths = input.report?.transfer_proof_paths ?? [];
  const bankScreenshotPaths = input.report?.screenshot_paths ?? [];
  const bankScreenshotImageUrls = bankScreenshotPaths.length
    ? await Promise.all(
        bankScreenshotPaths.map(async (path) => {
          const { data } = await sb.storage.from('payments').createSignedUrl(path, 60 * 60 * 24 * 7);
          return data?.signedUrl ? { path, url: data.signedUrl } : null;
        }),
      ).then((items) => items.filter((item): item is { path: string; url: string } => Boolean(item)))
    : [];
  const transferProofImageUrls = transferProofPaths.length
    ? await Promise.all(
        transferProofPaths.map(async (path) => {
          const { data } = await sb.storage.from('payments').createSignedUrl(path, 60 * 60 * 24 * 7);
          return data?.signedUrl ? { path, url: data.signedUrl } : null;
        }),
      ).then((items) => items.filter((item): item is { path: string; url: string } => Boolean(item)))
    : [];

  return {
    clients: clients ?? [],
    yearMonth: input.yearMonth,
    title: monthlySettlementTitle(input.yearMonth),
    transactions,
    ocrDocuments: input.report?.ocr_documents ?? [],
    bankScreenshotImageUrls,
    transferProofImageUrls,
    completedPosts,
    processingStatus: (input.report?.processing_status as MonthlySettlementReportData['processingStatus'] | undefined) ?? 'done',
    processingError: input.report?.processing_error ?? null,
    totals: {
      incoming,
      outgoing,
      net: incoming - outgoing,
      completedPosts: completedPosts.length,
      settledPosts: completedPosts.filter((item) => item.settlementStatus === 'done').length,
      payablePosts: completedPosts.filter((item) => item.settlementStatus === 'payable').length,
      transferProofCount: transferProofImageUrls.length,
    },
    createdAtLabel: formatCreatedAtLabel(input.report?.created_at),
  };
}
