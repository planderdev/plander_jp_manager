import { createAdminClient } from '@/lib/supabase/admin';
import { sumRows, type ReportClient, type ReportRow } from '@/lib/report-links';
import type { MonthlySettlementTransaction } from '@/lib/bank-ocr';

export type PaymentStatus = 'upload_pending' | 'settled' | 'settlement_pending';

export type InternalPaymentReportRow = ReportRow & {
  paymentStatus: PaymentStatus;
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
  monthlySettlementSummary: {
    incomingTotal: number;
    outgoingTotal: number;
    netTotal: number;
    reports: Array<{
      id: number;
      title: string;
      yearMonth: string;
      shareToken: string;
    }>;
  } | null;
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
  if (!post || post.settlement_status === 'pending') return 'upload_pending';
  if (post.settlement_status === 'done') return 'settled';
  return 'settlement_pending';
}

function makePeriodLabel(fromDate?: string | null, toDate?: string | null) {
  if (fromDate && toDate) return `${fromDate} ~ ${toDate}`;
  if (fromDate) return `${fromDate} ~`;
  if (toDate) return `~ ${toDate}`;
  return '전체 기간';
}

function collectYearMonths(fromDate?: string | null, toDate?: string | null, schedules: ScheduleRecord[] = []) {
  const months = new Set<string>();

  if (fromDate && toDate) {
    const start = new Date(`${fromDate}T00:00:00+09:00`);
    const end = new Date(`${toDate}T00:00:00+09:00`);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end) {
      let year = start.getFullYear();
      let month = start.getMonth();
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();

      while (year < endYear || (year === endYear && month <= endMonth)) {
        months.add(`${year}-${String(month + 1).padStart(2, '0')}`);
        month += 1;
        if (month > 11) {
          month = 0;
          year += 1;
        }
      }
    }
  }

  schedules.forEach((schedule) => {
    if (schedule.scheduled_at?.slice(0, 7)) {
      months.add(schedule.scheduled_at.slice(0, 7));
    }
  });

  return Array.from(months).sort();
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
  const relatedClientIds = Array.from(
    new Set(
      schedules
        .map((schedule) => first(schedule.clients)?.id)
        .filter((value): value is number => Number.isFinite(value)),
    ),
  );
  const rows: InternalPaymentReportRow[] = schedules.map((schedule) => {
    const client = first(schedule.clients);
    const influencer = first(schedule.influencers);
    const post = first(schedule.posts);
    const status = paymentStatus(post);
    const unitPriceJpy = influencer?.unit_price ?? 0;

    return {
      id: post?.id ?? `schedule-${schedule.id}`,
      visitDate: schedule.scheduled_at?.slice(0, 10) ?? '-',
      storeName: client?.company_name ?? '-',
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
      unitPriceJpy,
      payoutKrw: unitPriceJpy * 10,
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

  const reportMonths = collectYearMonths(fromDate, toDate, schedules);
  let monthlySettlementSummary: InternalPaymentReportData['monthlySettlementSummary'] = null;

  if (reportMonths.length && relatedClientIds.length) {
    let settlementQuery = sb.from('monthly_settlement_reports')
      .select('id, title, year_month, share_token, client_ids, transactions')
      .in('year_month', reportMonths)
      .order('year_month', { ascending: false })
      .order('created_at', { ascending: false });

    if (clientId) {
      settlementQuery = settlementQuery.contains('client_ids', [clientId]);
    }

    const { data: settlementReports } = await settlementQuery;
    const filteredReports = (settlementReports ?? []).filter((report: any) => {
      const ids = Array.isArray(report.client_ids) ? report.client_ids.map(Number) as number[] : [];
      return ids.some((id: number) => relatedClientIds.includes(id));
    });

    if (filteredReports.length) {
      const transactions = filteredReports.flatMap((report: any) =>
        ((report.transactions ?? []) as MonthlySettlementTransaction[]),
      );

      monthlySettlementSummary = {
        incomingTotal: transactions
          .filter((item) => item.direction === 'incoming')
          .reduce((sum, item) => sum + item.amount, 0),
        outgoingTotal: transactions
          .filter((item) => item.direction === 'outgoing')
          .reduce((sum, item) => sum + item.amount, 0),
        netTotal: transactions.reduce(
          (sum, item) => sum + (item.direction === 'incoming' ? item.amount : -item.amount),
          0,
        ),
        reports: filteredReports.map((report: any) => ({
          id: report.id,
          title: report.title,
          yearMonth: report.year_month,
          shareToken: report.share_token,
        })),
      };
    }
  }

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
    monthlySettlementSummary,
    periodLabel: makePeriodLabel(fromDate, toDate),
  };
}
