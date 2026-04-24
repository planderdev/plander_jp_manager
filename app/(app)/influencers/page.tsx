import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { deleteInfluencerAction } from '@/actions/influencers';
import { contactStatusLabel, genderLabel } from '@/lib/labels';
import ChannelIcon from '@/components/ChannelIcon';
import MoneyText from '@/components/MoneyText';
import { getI18n } from '@/lib/i18n/server';
import SortableHeaderLink from '@/components/table/SortableHeaderLink';
import { sortItems, type SortOrder } from '@/lib/table-sort';

export default async function InfluencersPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; order?: SortOrder }> }) {
  const currentSearchParams = await searchParams;
  const { q } = currentSearchParams;
  const { locale, t } = await getI18n();
  const sb = await createClient();
  let query = sb.from('influencers').select('*').order('created_at', { ascending: false });
  if (q) query = query.ilike('handle', `%${q}%`);
  const { data: list } = await query;
  const currentSort = currentSearchParams.sort ?? 'created_at';
  const currentOrder = currentSearchParams.order === 'asc' ? 'asc' : 'desc';
  const sortedList = sortItems(list ?? [], (item) => {
    switch (currentSort) {
      case 'channel':
        return item.channel;
      case 'handle':
        return item.handle;
      case 'line_id':
        return item.line_id;
      case 'account_url':
        return item.account_url;
      case 'followers':
        return item.followers ?? 0;
      case 'age':
        return item.age ?? '';
      case 'gender':
        return item.gender ?? '';
      case 'unit_price':
        return item.unit_price ?? 0;
      case 'contact_status':
        return item.contact_status ?? '';
      default:
        return item.created_at;
    }
  }, currentOrder);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('influencer.title')}</h1>
        <Link href="/influencers/new" className="bg-black text-white px-4 py-2 rounded">{t('influencer.new')}</Link>
      </div>

      <form className="mb-4">
        <input name="q" defaultValue={q ?? ''} placeholder={t('influencer.searchPlaceholder')} className="border rounded p-2 w-64" />
        <input type="hidden" name="sort" value={currentSort} />
        <input type="hidden" name="order" value={currentOrder} />
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3"><SortableHeaderLink label={t('influencerForm.channel')} sortKey="channel" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('influencer.handle')} sortKey="handle" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('influencer.lineId')} sortKey="line_id" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('influencer.account')} sortKey="account_url" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('influencer.followers')} sortKey="followers" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.age')} sortKey="age" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.gender')} sortKey="gender" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.unitPrice')} sortKey="unit_price" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('influencer.contactStatus')} sortKey="contact_status" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3">{t('common.management')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedList.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="p-3"><ChannelIcon channel={i.channel} /></td>
                <td className="p-3 font-medium">
                  <Link href={`/influencers/${i.id}`} className="text-blue-600 hover:underline">@{i.handle}</Link>
                </td>
                <td className="p-3">{i.line_id ?? '-'}</td>
                <td className="p-3">
                  {i.account_url && (
                    <a href={i.account_url} target="_blank" className="text-xs bg-blue-50 border border-blue-300 rounded px-2 py-1 text-blue-700 hover:bg-blue-100">
                      {t('influencer.openAccount')}
                    </a>
                  )}
                </td>
                <td className="p-3">{i.followers?.toLocaleString()} {t('common.people')}</td>
                <td className="p-3">{i.age ?? '-'}</td>
                <td className="p-3">{genderLabel(i.gender, locale)}</td>
                <td className="p-3"><MoneyText value={i.unit_price} suffix=" JPY" /></td>
                <td className="p-3">{contactStatusLabel(i.contact_status, locale)}</td>
                <td className="p-3 space-x-2">
                  <Link href={`/influencers/${i.id}/edit`} className="text-blue-600">{t('common.edit')}</Link>
                  <form action={async () => { 'use server'; await deleteInfluencerAction(i.id); }} className="inline">
                    <button className="text-red-500">{t('common.delete')}</button>
                  </form>
                </td>
              </tr>
            ))}
            {!sortedList.length && (
              <tr><td colSpan={10} className="p-8 text-center text-gray-400">{t('influencer.none')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
