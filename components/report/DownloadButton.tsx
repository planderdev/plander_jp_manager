'use client';
import { getReportDownloadUrl } from '@/actions/reports';

export default function DownloadButton({ filePath }: { filePath: string }) {
  async function handle() {
    const url = await getReportDownloadUrl(filePath);
    if (url) window.open(url, '_blank');
  }
  return <button onClick={handle} className="text-blue-600 hover:underline">다운로드</button>;
}