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
  grade: 'A' | 'B' | 'C';
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
  influencers: Array<{
    handle: string | null;
    followers: number | null;
    account_url: string | null;
    channel: string | null;
  }> | null;
  schedules: Array<{
    scheduled_at: string | null;
  }> | null;
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
  schedules?: Array<{ scheduled_at?: string | null }> | null;
  created_at?: string | null;
}) {
  return row.uploaded_on || row.schedules?.[0]?.scheduled_at || row.created_at || null;
}

function isWithinMonth(value: string | null, month: string) {
  if (!value) return false;
  return value.slice(0, 7) === month;
}

function gradeForRow(views: number, likes: number, comments: number, shares: number): 'A' | 'B' | 'C' {
  const engagement = likes + comments + shares;
  if (views >= 10000 || engagement >= 300) return 'A';
  if (views >= 3000 || engagement >= 120) return 'B';
  return 'C';
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

  const [{ data: client }, { data: postData }] = await Promise.all([
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
  ]);

  const allPosts = (postData ?? []) as PostRecord[];
  const currentRows = allPosts
    .filter((row) => isWithinMonth(resolveVisitDate(row), yearMonth))
    .map((row) => ({
      id: row.id,
      visitDate: resolveVisitDate(row)?.slice(0, 10) ?? yearMonth,
      handle: row.influencers?.[0]?.handle ?? 'sample_creator',
      accountUrl: row.influencers?.[0]?.account_url ?? null,
      followers: row.influencers?.[0]?.followers ?? 0,
      postUrl: row.post_url ?? null,
      views: row.views ?? 0,
      likes: row.likes ?? 0,
      comments: row.comments ?? 0,
      shares: row.shares ?? 0,
      grade: gradeForRow(row.views ?? 0, row.likes ?? 0, row.comments ?? 0, row.shares ?? 0),
      channel: row.influencers?.[0]?.channel ?? 'instagram',
    })) as ReportRow[];

  const prevRows = allPosts
    .filter((row) => isWithinMonth(resolveVisitDate(row), prevMonth))
    .map((row) => ({
      id: row.id,
      visitDate: resolveVisitDate(row)?.slice(0, 10) ?? prevMonth,
      handle: row.influencers?.[0]?.handle ?? 'sample_creator',
      accountUrl: row.influencers?.[0]?.account_url ?? null,
      followers: row.influencers?.[0]?.followers ?? 0,
      postUrl: row.post_url ?? null,
      views: row.views ?? 0,
      likes: row.likes ?? 0,
      comments: row.comments ?? 0,
      shares: row.shares ?? 0,
      grade: gradeForRow(row.views ?? 0, row.likes ?? 0, row.comments ?? 0, row.shares ?? 0),
      channel: row.influencers?.[0]?.channel ?? 'instagram',
    })) as ReportRow[];

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
      grade: gradeForRow(seeds[index % seeds.length].views, seeds[index % seeds.length].likes, seeds[index % seeds.length].comments, seeds[index % seeds.length].shares),
      channel: item.channel ?? 'instagram',
    }));
  }

  const currentTotals = sumRows(rows);
  const prevTotals = sumRows(prevRows);
  const channelMap = new Map<string, ReportRow[]>();
  rows.forEach((row) => {
    const bucket = channelMap.get(row.channel) ?? [];
    bucket.push(row);
    channelMap.set(row.channel, bucket);
  });
  if (!channelMap.size) channelMap.set('instagram', rows);

  return {
    client: (client as ReportClient | null) ?? null,
    rows,
    currentTotals,
    prevTotals,
    channelEntries: Array.from(channelMap.entries()),
    usingFallback,
    yearMonth,
  };
}
