import Link from 'next/link';
import { getMetricsForMonth, saveMetricsForMonth } from '@/actions/metrics';
import SubmitButton from '@/components/SubmitButton';
import BackButton from '@/components/BackButton';
import { dateLocale } from '@/lib/datetime';
import { getI18n } from '@/lib/i18n/server';
import type { PostMetricsHistory, SelfGrade } from '@/types/db';

function defaultMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default async function MetricsPage({
  searchParams,
}: { searchParams: Promise<{ month?: string }> }) {
  const { month: m } = await searchParams;
  const { locale, t } = await getI18n();
  const month = m || defaultMonth();
  const { posts, history } = await getMetricsForMonth(month);

  const histMap = new Map<number, PostMetricsHistory>();
  for (const h of history) histMap.set(h.post_id, h);

  const gradeOptions: SelfGrade[] = ['S', 'A', 'B', 'C', 'F', 'pending'];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{t('metrics.title')}</h1>
        <Link href="/campaigns/completed" className="text-sm text-blue-600 hover:underline">
          {t('metrics.backToCompleted')}
        </Link>
      </div>

      <form className="bg-white rounded-lg shadow p-4 flex items-end gap-3">
        <div>
          <label className="text-sm block mb-1 font-medium">{t('metrics.month')}</label>
          <input type="month" name="month" defaultValue={month}
            className="border border-gray-400 rounded p-2" />
        </div>
        <button className="bg-black text-white px-4 py-2 rounded text-sm">{t('common.search')}</button>
      </form>

      {posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
          {t('metrics.noPosts')}
        </div>
      ) : (
        <form action={saveMetricsForMonth} className="space-y-4">
          <input type="hidden" name="month" value={month} />

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">{t('common.uploadDate')}</th>
                  <th className="p-3">{t('common.influencer')}</th>
                  <th className="p-3">{t('common.companyName')}</th>
                  <th className="p-3">{t('common.link')}</th>
                  <th className="p-3">{t('common.views')}</th>
                  <th className="p-3">{t('common.likes')}</th>
                  <th className="p-3">{t('common.comments')}</th>
                  <th className="p-3">{t('common.shares')}</th>
                  <th className="p-3">{t('reportMockup.selfGrade')}</th>
                  <th className="p-3">{t('metrics.lastEntered')}</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p: any) => {
                  const h = histMap.get(p.id);
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="p-3">{p.uploaded_on ?? '-'}</td>
                      <td className="p-3">@{p.influencers?.handle}</td>
                      <td className="p-3">{p.clients?.company_name}</td>
                      <td className="p-3">
                        <a href={p.post_url} target="_blank"
                          className="inline-block bg-blue-50 border border-blue-300 rounded px-2 py-1 text-xs text-blue-700 hover:bg-blue-100">
                          {t('common.link')}
                        </a>
                      </td>
                      <td className="p-3">
                        <input type="number" name={`views_${p.id}`} defaultValue={h?.views ?? p.views ?? 0}
                          className="border border-gray-400 rounded p-1 w-24 text-right" />
                      </td>
                      <td className="p-3">
                        <input type="number" name={`likes_${p.id}`} defaultValue={h?.likes ?? p.likes ?? 0}
                          className="border border-gray-400 rounded p-1 w-24 text-right" />
                      </td>
                      <td className="p-3">
                        <input type="number" name={`comments_${p.id}`} defaultValue={h?.comments ?? p.comments ?? 0}
                          className="border border-gray-400 rounded p-1 w-20 text-right" />
                      </td>
                      <td className="p-3">
                        <input type="number" name={`shares_${p.id}`} defaultValue={h?.shares ?? p.shares ?? 0}
                          className="border border-gray-400 rounded p-1 w-20 text-right" />
                      </td>
                      <td className="p-3">
                        <select
                          name={`self_grade_${p.id}`}
                          defaultValue={h?.self_grade ?? 'pending'}
                          className="border border-gray-400 rounded p-1 w-28"
                        >
                          {gradeOptions.map((grade) => (
                            <option key={grade} value={grade}>
                              {grade === 'pending' ? t('grade.pending') : grade}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-xs text-gray-500">
                        {h?.entered_at ? new Date(h.entered_at).toLocaleDateString(dateLocale(locale)) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <SubmitButton>{t('common.save')}</SubmitButton>
            <BackButton />
          </div>
        </form>
      )}
    </div>
  );
}
