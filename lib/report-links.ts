import { createAdminClient } from '@/lib/supabase/admin';

export type ReportRow = {
  id: number | string;
  visitDate: string;
  handle: string;
  accountUrl: string | null;
  followers: number;
  postUrl: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'F' | 'pending';
  channel: string;
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
  influencers:
    | {
        handle: string | null;
        followers: number | null;
        account_url: string | null;
        channel: string | null;
      }
    | Array<{
        handle: string | null;
        followers: number | null;
        account_url: string | null;
        channel: string | null;
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

export type ReportClient = {
  id: number;
  company_name: string;
  contract_start: string | null;
  contract_end: string | null;
  contract_product: string | null;
  manager_name: string | null;
  sales_region: string | null;
  category: string | null;
};

export type ReportViewData = {
  client: ReportClient | null;
  rows: ReportRow[];
  currentTotals: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    followers: number;
  };
  prevTotals: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    followers: number;
  };
  channelEntries: Array<[string, ReportRow[]]>;
  clientMonthlyCounts: Array<{
    key: string;
    clientName: string;
    month: string;
    count: number;
  }>;
  usingFallback: boolean;
  yearMonth: string;
};

export function previousMonth(month: string) {
  const [year, monthValue] = month.split('-').map(Number);
  const prev = new Date(Date.UTC(year, monthValue - 2, 1));
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function displayMonth(month: string, locale: string) {
  const [year, monthValue] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    timeZone: 'Asia/Seoul',
  }).format(new Date(Date.UTC(year, monthValue - 1, 1)));
}

function resolveVisitDate(row: {
  uploaded_on?: string | null;
  schedules?: { scheduled_at?: string | null } | Array<{ scheduled_at?: string | null }> | null;
  created_at?: string | null;
}) {
  const schedule = Array.isArray(row.schedules) ? row.schedules[0] : row.schedules;
  return row.uploaded_on || schedule?.scheduled_at || row.created_at || null;
}

function normalizeInfluencer(
  value:
    | PostRecord['influencers']
    | null
) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function isWithinMonth(value: string | null, month: string) {
  if (!value) return false;
  return value.slice(0, 7) === month;
}

export function sumRows(rows: ReportRow[]) {
  return rows.reduce(
    (acc, row) => ({
      views: acc.views + row.views,
      likes: acc.likes + row.likes,
      comments: acc.comments + row.comments,
      shares: acc.shares + row.shares,
      followers: acc.followers + row.followers,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, followers: 0 }
  );
}

export async function getReportViewData(clientId: number, yearMonth: string): Promise<ReportViewData> {
  const sb = createAdminClient();
  const prevMonth = previousMonth(yearMonth);
  const [year, monthValue] = yearMonth.split('-').map(Number);
  const monthStart = `${yearMonth}-01T00:00:00+09:00`;
  const nextMonthDate = new Date(Date.UTC(year, monthValue, 1));
  const monthEnd = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, '0')}-01T00:00:00+09:00`;

  const [{ data: client }, { data: postData }, { data: scheduleData }] = await Promise.all([
    sb.from('clients')
      .select('id, company_name, contract_start, contract_end, contract_product, manager_name, sales_region, category')
      .eq('id', clientId)
      .single(),
    sb.from('posts').select(`
        id,
        client_id,
        influencer_id,
        post_url,
        views,
        likes,
        comments,
        shares,
        uploaded_on,
        created_at,
        influencers (
          handle,
          followers,
          account_url,
          channel
        ),
        schedules (
          scheduled_at
        )
      `).eq('client_id', clientId).order('created_at', { ascending: false }),
    sb.from('schedules')
      .select('id, scheduled_at')
      .eq('client_id', clientId)
      .gte('scheduled_at', monthStart)
      .lt('scheduled_at', monthEnd),
  ]);

  const allPosts = (postData ?? []) as unknown as PostRecord[];
  const postIds = allPosts.map((row) => row.id);

  const [thisHistory, prevHistory] = postIds.length
    ? await Promise.all([
        sb.from('post_metrics_history').select('post_id, views, likes, comments, shares, self_grade').in('post_id', postIds).eq('month', yearMonth),
        sb.from('post_metrics_history').select('post_id, views, likes, comments, shares, self_grade').in('post_id', postIds).eq('month', prevMonth),
      ])
    : [{ data: [] }, { data: [] }];

  const currentHistoryMap = new Map<number, { views: number | null; likes: number | null; comments: number | null; shares: number | null; self_grade: ReportRow['grade'] | null }>();
  for (const item of thisHistory.data ?? []) {
    currentHistoryMap.set(item.post_id, {
      views: item.views,
      likes: item.likes,
      comments: item.comments,
      shares: item.shares,
      self_grade: (item.self_grade as ReportRow['grade'] | null) ?? null,
    });
  }

  const prevHistoryRows = (prevHistory.data ?? []) as Array<{ views: number | null; likes: number | null; comments: number | null; shares: number | null }>;
  const currentRows = allPosts
    .filter((row) => isWithinMonth(resolveVisitDate(row), yearMonth))
    .map((row) => {
      const influencer = normalizeInfluencer(row.influencers);
      const history = currentHistoryMap.get(row.id);
      return ({
      id: row.id,
      visitDate: resolveVisitDate(row)?.slice(0, 10) ?? yearMonth,
      handle: influencer?.handle ?? 'sample_creator',
      accountUrl: influencer?.account_url ?? null,
      followers: influencer?.followers ?? 0,
      postUrl: row.post_url ?? null,
      views: history?.views ?? row.views ?? 0,
      likes: history?.likes ?? row.likes ?? 0,
      comments: history?.comments ?? row.comments ?? 0,
      shares: history?.shares ?? row.shares ?? 0,
      grade: history?.self_grade ?? 'pending',
      channel: influencer?.channel ?? 'instagram',
    });
    }) as ReportRow[];

  let rows = currentRows;
  let usingFallback = false;

  if (!rows.length) {
    usingFallback = true;
    const { data: influencers } = await sb.from('influencers')
      .select('id, handle, followers, account_url, channel')
      .order('created_at', { ascending: false })
      .limit(3);
    const seeds = [
      { views: 18420, likes: 640, comments: 41, shares: 17 },
      { views: 9230, likes: 381, comments: 26, shares: 8 },
      { views: 5170, likes: 219, comments: 19, shares: 5 },
    ];
    rows = (influencers ?? []).map((item, index) => ({
      id: item.id,
      visitDate: `${yearMonth}-${String(index + 8).padStart(2, '0')}`,
      handle: item.handle,
      accountUrl: item.account_url,
      followers: item.followers ?? 0,
      postUrl: item.account_url,
      ...seeds[index % seeds.length],
      grade: 'pending',
      channel: item.channel ?? 'instagram',
    }));
  }

  const currentTotals = sumRows(rows);
  const prevTotals = prevHistoryRows.reduce<ReportViewData['prevTotals']>(
    (acc, row) => ({
      views: acc.views + (row.views ?? 0),
      likes: acc.likes + (row.likes ?? 0),
      comments: acc.comments + (row.comments ?? 0),
      shares: acc.shares + (row.shares ?? 0),
      followers: acc.followers,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, followers: 0 }
  );
  const channelMap = new Map<string, ReportRow[]>();
  rows.forEach((row) => {
    const bucket = channelMap.get(row.channel) ?? [];
    bucket.push(row);
    channelMap.set(row.channel, bucket);
  });
  if (!channelMap.size) channelMap.set('instagram', rows);
  const clientMonthlyCounts = [{
    key: `${client?.company_name ?? clientId}:${yearMonth}`,
    clientName: client?.company_name ?? '-',
    month: yearMonth,
    count: (scheduleData ?? []).length,
  }];

  return {
    client: (client as ReportClient | null) ?? null,
    rows,
    currentTotals,
    prevTotals,
    channelEntries: Array.from(channelMap.entries()),
    clientMonthlyCounts,
    usingFallback,
    yearMonth,
  };
}
