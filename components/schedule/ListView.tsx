import Link from 'next/link';
import { useMemo, useState } from 'react';
import DeleteButton from './DeleteButton';
import { shortLocalized, todayKR, ymdKR } from '@/lib/datetime';
import { sortItems, type SortOrder } from '@/lib/table-sort';
import type { Schedule } from '@/types/db';
import { useI18n } from '@/lib/i18n/provider';

export default function ListView({ schedules }: { schedules: Schedule[] }) {
  const { locale, t } = useI18n();
  const today = todayKR();
  const [sortKey, setSortKey] = useState<'scheduled_at' | 'company_name' | 'handle' | 'account_url'>('scheduled_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const sortedSchedules = useMemo(() => sortItems(schedules, (schedule) => {
    switch (sortKey) {
      case 'company_name':
        return schedule.clients?.company_name;
      case 'handle':
        return schedule.influencers?.handle;
      case 'account_url':
        return schedule.influencers?.account_url;
      default:
        return schedule.scheduled_at;
    }
  }, sortOrder), [schedules, sortKey, sortOrder]);

  function toggleSort(nextKey: typeof sortKey) {
    if (sortKey === nextKey) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextKey);
    setSortOrder('asc');
  }

  function labelWithDirection(label: string, key: typeof sortKey) {
    if (sortKey !== key) return label;
    return `${label}${sortOrder === 'asc' ? ' ^' : ' v'}`;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3"><button type="button" onClick={() => toggleSort('scheduled_at')} className="hover:text-black">{labelWithDirection(t('common.date'), 'scheduled_at')}</button></th>
            <th className="p-3"><button type="button" onClick={() => toggleSort('company_name')} className="hover:text-black">{labelWithDirection(t('common.companyName'), 'company_name')}</button></th>
            <th className="p-3"><button type="button" onClick={() => toggleSort('handle')} className="hover:text-black">{labelWithDirection(t('postForm.handle'), 'handle')}</button></th>
            <th className="p-3"><button type="button" onClick={() => toggleSort('account_url')} className="hover:text-black">{labelWithDirection(t('postForm.accountLink'), 'account_url')}</button></th>
            <th className="p-3">{t('common.management')}</th>
          </tr>
        </thead>
        <tbody>
          {sortedSchedules.map((s) => {
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
