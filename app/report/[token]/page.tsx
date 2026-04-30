import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SharedReportView from '@/components/report/SharedReportView';
import { getI18n } from '@/lib/i18n/server';
import { getReportViewData } from '@/lib/report-links';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SortOrder } from '@/lib/table-sort';

const SHARE_TITLE = 'Plander';
const SHARE_DESCRIPTION = '플랜더는 이름 그대로 신규브랜드 및 기존브랜드 에 필요한 브랜딩/리브랜딩의 모든 일을 할수 있는 능력이 있는 회사입니다.';
const METADATA_BASE = new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://plander-jp-manager.vercel.app');

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const imagePath = `/report/${token}/opengraph-image`;

  return {
    metadataBase: METADATA_BASE,
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    openGraph: {
      title: SHARE_TITLE,
      description: SHARE_DESCRIPTION,
      type: 'website',
      images: [{ url: imagePath, width: 1200, height: 630, alt: SHARE_TITLE }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SHARE_TITLE,
      description: SHARE_DESCRIPTION,
      images: [imagePath],
    },
  };
}

export default async function PublicReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ sort?: string; order?: SortOrder }>;
}) {
  const { token } = await params;
  const currentSearchParams = await searchParams;
  const { locale, t } = await getI18n();
  const sb = createAdminClient();
  const { data: report } = await sb
    .from('shared_reports')
    .select('client_id, client_ids, year_month, created_at')
    .eq('share_token', token)
    .single();

  if (!report) notFound();

  const data = await getReportViewData(report.client_ids?.length ? report.client_ids : report.client_id, report.year_month);
  return (
    <SharedReportView
      locale={locale}
      t={t}
      data={data}
      generatedAt={report.created_at ?? null}
      currentSort={currentSearchParams.sort}
      currentOrder={currentSearchParams.order === 'asc' ? 'asc' : 'desc'}
      searchParams={currentSearchParams}
    />
  );
}
