import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getClientBriefConfig } from '@/lib/briefing-config';
import { notFound, redirect } from 'next/navigation';
import BackButton from '@/components/BackButton';
import DeleteButton from '@/components/client/DeleteButton';
import { clientStatusLabel, clientStatusClass } from '@/lib/labels';
import MoneyText from '@/components/MoneyText';
import { getI18n } from '@/lib/i18n/server';

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { locale, t } = await getI18n();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');

  const { data: c } = await sb.from('clients').select('*').eq('id', Number(id)).single();
  if (!c) notFound();
  const briefConfig = await getClientBriefConfig(c.id);

  const { data: ownerAdmin } = c.owner_id
    ? await sb.from('admins').select('name').eq('id', c.owner_id).single()
    : { data: null };

  const canEdit = !c.owner_id || c.owner_id === user.id;
  const fullAddress = [c.region, c.district, c.road_address, c.building_detail].filter(Boolean).join(' ');

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">{c.company_name}</h1>
        {c.sales_region && (
          <span className="text-sm text-gray-600">({c.sales_region})</span>
        )}
        <span className={`inline-block px-2 py-1 rounded text-xs ${clientStatusClass(c.status)}`}>
          {clientStatusLabel(c.status, locale)}
        </span>
      </div>

      <section className="bg-white rounded-lg shadow p-6 space-y-3">
        <h2 className="text-sm font-semibold border-b border-gray-300 pb-1">{t('common.basicInfo')}</h2>
        <Row label={t('common.category')} value={c.category ?? '-'} />
        <Row label={t('common.region')} value={c.sales_region ?? '-'} />
        <Row label={t('clientForm.storeNameJa')} value={c.store_name_ja ?? '-'} />
        <Row label={t('clientForm.contactPerson')} value={c.contact_person ?? '-'} />
        <Row label={t('common.contact')} value={c.phone ?? '-'} />
        <Row label={t('common.email')} value={c.email ?? '-'} />
        <Row label={t('common.address')} value={`${c.postal_code ? `(${c.postal_code}) ` : ''}${fullAddress || '-'}`} />
        <Row label={t('clientForm.addressJa')} value={c.address_ja ?? '-'} />
        <Row label={t('clientForm.businessHours')} value={c.business_hours ?? '-'} />
        <Row label={t('clientForm.providedMenu')} value={c.provided_menu ?? '-'} />
        <Row label={t('clientForm.visitNoticeTime')} value={briefConfig.visitNoticeTime} />
      </section>

      <section className="bg-white rounded-lg shadow p-6 space-y-3">
        <h2 className="text-sm font-semibold border-b border-gray-300 pb-1">{t('common.salesInfo')}</h2>
        <Row label={t('clientForm.firstContactDate')} value={c.first_contact_date ?? '-'} />
        <Row label={t('clientForm.contractProduct')} value={c.contract_product ?? '-'} />
        <Row label={t('clientForm.contractAmount')} value={<MoneyText value={c.contract_amount} />} />
        <Row label={t('common.contractPeriod')} value={`${c.contract_start ?? '-'} ~ ${c.contract_end ?? '-'}`} />
        <Row label={t('clientForm.owner')} value={ownerAdmin?.name ?? '-'} />
      </section>

      {c.memo && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold border-b border-gray-300 pb-1 mb-3">{t('common.memo')}</h2>
          <p className="whitespace-pre-wrap">{c.memo}</p>
        </section>
      )}

      <div className="flex gap-3 flex-wrap">
        {canEdit ? (
          <Link href={`/campaigns/clients/${c.id}/edit`}
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">{t('common.edit')}</Link>
        ) : (
          <span className="text-sm text-gray-500 self-center">{t('client.ownerOnly', { name: ownerAdmin?.name ?? '-' })}</span>
        )}
        <BackButton />
        {canEdit && (
          <div className="ml-auto">
            <DeleteButton id={c.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <div className="text-xs text-gray-500 sm:w-24 sm:flex-shrink-0">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
