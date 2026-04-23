import { createAdminClient } from '@/lib/supabase/admin';
import { sumRows, type ReportClient, type ReportRow } from '@/lib/report-links';

export type PaymentStatus = 'upload_pending' | 'settled' | 'settlement_pending';

export type InternalPaymentReportRow = ReportRow & {
  paymentStatus: PaymentStatus;
  settlementCount: number;
  unitPriceJpy: number;
  payoutKrw: number;
};

export type InternalPaymentReportData = {
  client: ReportClient | null;
  influencer: { id: number; handle: string | null } | null;
  rows: InternalPaymentReportRow[];
  currentTotals: ReturnType<typeof sumRows>;
  channelEntries: Array<[string, InternalPaymentReportRow[]]>;
  clientMonthlyCounts: Array<{
    key: string;
    clientName: string;
    month: string;
    count: number;
  }>;
  expenses: {
    paidTotal: number;
    payableTotal: number;
    pendingTotal: number;
    grandTotal: number;
  };
  periodLabel: string;
};

type InternalReportFilters = {
  clientId?: number | null;
  influencerId?: number | null;
  fromDate?: string | null;
  toDate?: string | null;
};

type ScheduleRecord = {
  id: number;
  scheduled_at: string | null;
  clients:
    | ReportClient
    | ReportClient[]
    | null;
  influencers:
    | {
        id: number;
        handle: string | null;
        followers: number | null;
        account_url: string | null;
        channel: string | null;
        unit_price: number | null;
      }
    | Array<{
        id: number;
        handle: string | null;
        followers: number | null;
        account_url: string | null;
        channel: string | null;
        unit_price: number | null;
      }>
    | null;
  posts:
    | SchedulePost
    | SchedulePost[]
    | null;
};

type SchedulePost = {
  id: number;
  settlement_count: number | null;
  post_url: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  settlement_status: string | null;
  uploaded_on: string | null;
  created_at: string | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function paymentStatus(post: SchedulePost | null): PaymentStatus {
  if (!post?.post_url) return 'upload_pending';
  if (post.settlement_status === 'done') return 'settled';
  return 'settlement_pending';
}

function makePeriodLabel(fromDate?: string | null, toDate?: string | null) {
  if (fromDate && toDate) return `${fromDate} ~ ${toDate}`;
  if (fromDate) return `${fromDate} ~`;
  if (toDate) return `~ ${toDate}`;
  return '전체 기간';
}

export async function getInternalPaymentReportData({
  clientId,
  influencerId,
  fromDate,
  toDate,
}: InternalReportFilters): Promise<InternalPaymentReportData> {
  const sb = createAdminClient();

  let query = sb.from('schedules')
    .select(`
      id,
      scheduled_at,
      clients (
        id,
        company_name,
        contract_start,
        contract_end,
        contract_product,
        manager_name,
        sales_region,
        category
      ),
      influencers (
        id,
        handle,
        followers,
        account_url,
        channel,
        unit_price
      ),
      posts (
        id,
        settlement_count,
        post_url,
        views,
        likes,
        comments,
        shares,
        settlement_status,
        uploaded_on,
        created_at
      )
    `)
    .order('scheduled_at', { ascending: true });

  if (clientId) query = query.eq('client_id', clientId);
  if (influencerId) query = query.eq('influencer_id', influencerId);
  if (fromDate) query = query.gte('scheduled_at', `${fromDate}T00:00:00+09:00`);
  if (toDate) query = query.lte('scheduled_at', `${toDate}T23:59:59+09:00`);

  const { data, error } = await query;
  if (error) throw new Error(`internal payment report schedules: ${error.message}`);

  const schedules = (data ?? []) as unknown as ScheduleRecord[];
  const rows: InternalPaymentReportRow[] = schedules.map((schedule) => {
    const influencer = first(schedule.influencers);
    const post = first(schedule.posts);
    const status = paymentStatus(post);
    const unitPriceJpy = influencer?.unit_price ?? 0;
    const settlementCount = Math.max(1, post?.settlement_count ?? 1);

    return {
      id: post?.id ?? `schedule-${schedule.id}`,
      visitDate: schedule.scheduled_at?.slice(0, 10) ?? '-',
      handle: influencer?.handle ?? '-',
      accountUrl: influencer?.account_url ?? null,
      followers: influencer?.followers ?? 0,
      postUrl: post?.post_url ?? null,
      views: post?.views ?? 0,
      likes: post?.likes ?? 0,
      comments: post?.comments ?? 0,
      shares: post?.shares ?? 0,
      grade: 'pending',
      channel: influencer?.channel ?? 'instagram',
      paymentStatus: status,
      settlementCount,
      unitPriceJpy,
      payoutKrw: unitPriceJpy * settlementCount * 10,
    };
  });

  const channelMap = new Map<string, InternalPaymentReportRow[]>();
  rows.forEach((row) => {
    const bucket = channelMap.get(row.channel) ?? [];
    bucket.push(row);
    channelMap.set(row.channel, bucket);
  });

  const clientMonthlyMap = new Map<string, { clientName: string; month: string; count: number }>();
  schedules.forEach((schedule) => {
    const client = first(schedule.clients);
    const month = schedule.scheduled_at?.slice(0, 7) ?? '-';
    const clientName = client?.company_name ?? '미지정';
    const key = `${clientName}:${month}`;
    const current = clientMonthlyMap.get(key) ?? { clientName, month, count: 0 };
    current.count += 1;
    clientMonthlyMap.set(key, current);
  });

  const paidTotal = rows
    .filter((row) => row.paymentStatus === 'settled')
    .reduce((acc, row) => acc + row.payoutKrw, 0);
  const payableTotal = rows
    .filter((row) => row.paymentStatus === 'settlement_pending')
    .reduce((acc, row) => acc + row.payoutKrw, 0);
  const pendingTotal = rows
    .filter((row) => row.paymentStatus === 'upload_pending')
    .reduce((acc, row) => acc + row.payoutKrw, 0);

  return {
    client: first(schedules.find((schedule) => first(schedule.clients))?.clients) ?? null,
    influencer: first(schedules.find((schedule) => first(schedule.influencers))?.influencers) ?? null,
    rows,
    currentTotals: sumRows(rows),
    channelEntries: Array.from(channelMap.entries()),
    clientMonthlyCounts: Array.from(clientMonthlyMap.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.clientName.localeCompare(b.clientName) || a.month.localeCompare(b.month)),
    expenses: {
      paidTotal,
      payableTotal,
      pendingTotal,
      grandTotal: paidTotal + payableTotal + pendingTotal,
    },
    periodLabel: makePeriodLabel(fromDate, toDate),
  };
}
