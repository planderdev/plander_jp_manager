import Link from 'next/link';
import DeleteButton from './DeleteButton';
import { shortLocalized, todayKR, ymdKR } from '@/lib/datetime';
import type { Schedule } from '@/types/db';
import { useI18n } from '@/lib/i18n/provider';

export default function ListView({ schedules }: { schedules: Schedule[] }) {
  const { locale, t } = useI18n();
  const today = todayKR();

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">{t('common.date')}</th>
            <th className="p-3">{t('common.companyName')}</th>
            <th className="p-3">{t('postForm.handle')}</th>
            <th className="p-3">{t('postForm.accountLink')}</th>
            <th className="p-3">{t('common.management')}</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s) => {
            const isPast = ymdKR(s.scheduled_at).localeCompare(today) < 0;
            const rowClass = isPast ? 'bg-gray-100 text-gray-500' : '';
            return (
              <tr key={s.id} className={`border-t ${rowClass}`}>
                <td className="p-3 font-medium">{shortLocalized(s.scheduled_at, locale)}</td>
                <td className="p-3">{s.clients?.company_name ?? '-'}</td>
                <td className="p-3">
                  <Link href={`/influencers/${s.influencer_id}`} className="text-blue-600 hover:underline">
                    @{s.influencers?.handle}
                  </Link>
                </td>
                <td className="p-3">
                  {s.influencers?.account_url && (
                    <a href={s.influencers.account_url} target="_blank" className="text-blue-600 hover:underline">{t('common.link')}</a>
                  )}
                </td>
                <td className="p-3 space-x-2">
                  <Link href={`/campaigns/schedules/${s.id}`} className="text-blue-600">{t('common.edit')}</Link>
                  <DeleteButton id={s.id} />
                </td>
              </tr>
            );
          })}
          {!schedules.length && (
            <tr><td colSpan={5} className="p-8 text-center text-gray-400">{t('dashboard.noSchedules')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
