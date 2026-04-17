'use client';
import { getReportDownloadUrl } from '@/actions/reports';
import { useI18n } from '@/lib/i18n/provider';

export default function DownloadButton({ filePath }: { filePath: string }) {
  const { t } = useI18n();

  async function handle() {
    const url = await getReportDownloadUrl(filePath);
    if (url) window.open(url, '_blank');
  }
  return <button onClick={handle} className="text-blue-600 hover:underline">{t('common.download')}</button>;
}
