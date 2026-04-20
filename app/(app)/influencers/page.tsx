import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { deleteInfluencerAction } from '@/actions/influencers';
import { contactStatusLabel, genderLabel } from '@/lib/labels';
import ChannelIcon from '@/components/ChannelIcon';
import MoneyText from '@/components/MoneyText';
import { getI18n } from '@/lib/i18n/server';

export default async function InfluencersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { locale, t } = await getI18n();
  const sb = await createClient();
  let query = sb.from('influencers').select('*').order('created_at', { ascending: false });
  if (q) query = query.ilike('handle', `%${q}%`);
  const { data: list } = await query;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('influencer.title')}</h1>
        <Link href="/influencers/new" className="bg-black text-white px-4 py-2 rounded">{t('influencer.new')}</Link>
      </div>

      <form className="mb-4">
        <input name="q" defaultValue={q ?? ''} placeholder={t('influencer.searchPlaceholder')} className="border rounded p-2 w-64" />
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">{t('influencerForm.channel')}</th>
              <th className="p-3">{t('influencer.handle')}</th>
              <th className="p-3">{t('influencer.lineId')}</th>
              <th className="p-3">{t('influencer.account')}</th>
              <th className="p-3">{t('influencer.followers')}</th>
              <th className="p-3">{t('common.age')}</th>
              <th className="p-3">{t('common.gender')}</th>
              <th className="p-3">{t('common.unitPrice')}</th>
              <th className="p-3">{t('influencer.contactStatus')}</th>
              <th className="p-3">{t('common.management')}</th>
            </tr>
          </thead>
          <tbody>
            {list?.map((i) => (
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
            {!list?.length && (
              <tr><td colSpan={10} className="p-8 text-center text-gray-400">{t('influencer.none')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
