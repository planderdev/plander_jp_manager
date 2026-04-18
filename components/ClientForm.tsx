'use client';

import type { Client, ClientStatus } from '@/types/db';
import SubmitButton from '@/components/SubmitButton';
import PhoneInput from '@/components/PhoneInput';
import AddressSearch from '@/components/AddressSearch';
import ChipSelect from '@/components/ChipSelect';
import NumberInput from '@/components/NumberInput';
import { useI18n } from '@/lib/i18n/provider';

type OptionItem = { id: number; value: string };
type Admin = { id: string; name: string };

export default function ClientForm({
  client, action, options, admins, currentUserId,
}: {
  client?: Client;
  action: (fd: FormData) => void;
  options: { categories: OptionItem[]; regions: OptionItem[]; products: OptionItem[] };
  admins: Admin[];
  currentUserId: string;
}) {
  const { t } = useI18n();
  const statusOptions: { value: ClientStatus; label: string }[] = [
    { value: 'contacted', label: t('sales.status.contacted') },
    { value: 'proposed', label: t('sales.status.proposed') },
    { value: 'negotiating', label: t('sales.status.negotiating') },
    { value: 'active', label: t('sales.status.active') },
    { value: 'paused', label: t('sales.status.paused') },
    { value: 'ended', label: t('sales.status.ended') },
  ];

  return (
    <form action={action} className="bg-white p-6 rounded-lg shadow space-y-6 max-w-3xl">
      {client && <input type="hidden" name="id" defaultValue={client.id} />}

      <div className="space-y-4">
        <h2 className="text-base font-semibold border-b border-gray-300 pb-1">{t('common.basicInfo')}</h2>

        <div>
          <label className="text-sm block mb-1 font-medium">{t('clientForm.companyName')}</label>
          <input name="company_name" defaultValue={client?.company_name ?? ''} required
            className="w-full border border-gray-400 rounded p-2" />
        </div>

        <div>
          <label className="text-sm block mb-1 font-medium">{t('clientForm.storeNameJa')}</label>
          <input name="store_name_ja" defaultValue={client?.store_name_ja ?? ''}
            className="w-full border border-gray-400 rounded p-2" />
        </div>

        <ChipSelect name="category" label={t('common.category')} kind="category"
          options={options.categories} defaultValue={client?.category ?? ''} multiple />

        <ChipSelect name="sales_region" label={t('common.region')} kind="sales_region"
          options={options.regions} defaultValue={client?.sales_region ?? ''} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm block mb-1 font-medium">{t('clientForm.contactPerson')}</label>
            <input name="contact_person" defaultValue={client?.contact_person ?? ''}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">{t('common.contact')}</label>
            <PhoneInput name="phone" defaultValue={client?.phone ?? ''} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm block mb-1 font-medium">{t('common.email')}</label>
            <input type="email" name="email" defaultValue={client?.email ?? ''}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
        </div>

        <div>
          <label className="text-sm block mb-2 font-medium">{t('common.address')}</label>
          <AddressSearch
            defaultPostal={client?.postal_code ?? ''}
            defaultRegion={client?.region ?? ''}
            defaultDistrict={client?.district ?? ''}
            defaultRoad={client?.road_address ?? ''}
            defaultDetail={client?.building_detail ?? ''}
          />
        </div>

        <div>
          <label className="text-sm block mb-1 font-medium">{t('clientForm.addressJa')}</label>
          <textarea name="address_ja" defaultValue={client?.address_ja ?? ''} rows={2}
            className="w-full border border-gray-400 rounded p-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm block mb-1 font-medium">{t('clientForm.businessHours')}</label>
            <input name="business_hours" defaultValue={client?.business_hours ?? ''}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">{t('clientForm.providedMenu')}</label>
            <textarea name="provided_menu" defaultValue={client?.provided_menu ?? ''} rows={2}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold border-b border-gray-300 pb-1">{t('common.salesInfo')}</h2>

        <div>
          <label className="text-sm block mb-1 font-medium">{t('common.status')} *</label>
          <select name="status" defaultValue={client?.status ?? 'contacted'} required
            className="w-full border border-gray-400 rounded p-2">
            {statusOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm block mb-1 font-medium">{t('clientForm.firstContactDate')}</label>
          <input type="date" name="first_contact_date"
            defaultValue={client?.first_contact_date ?? ''}
            className="w-full border border-gray-400 rounded p-2 max-w-xs" />
        </div>

        <ChipSelect name="contract_product" label={t('clientForm.contractProduct')} kind="product"
          options={options.products} defaultValue={client?.contract_product ?? ''} multiple />

        <div>
          <label className="text-sm block mb-1 font-medium">{t('clientForm.contractAmount')}</label>
          <NumberInput name="contract_amount"
            defaultValue={client?.contract_amount ?? ''}
            className="w-full border border-gray-400 rounded p-2 max-w-xs" />
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="text-sm block mb-1 font-medium">{t('clientForm.contractStart')}</label>
            <input type="date" name="contract_start"
              defaultValue={client?.contract_start ?? ''}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">{t('clientForm.contractEnd')}</label>
            <input type="date" name="contract_end"
              defaultValue={client?.contract_end ?? ''}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
        </div>

        <div>
          <label className="text-sm block mb-1 font-medium">{t('clientForm.owner')}</label>
          <select name="owner_id"
            defaultValue={client?.owner_id ?? currentUserId}
            className="w-full border border-gray-400 rounded p-2 max-w-xs">
            {admins.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm block mb-1 font-medium">{t('common.memo')}</label>
          <textarea name="memo" defaultValue={client?.memo ?? ''} rows={3}
            className="w-full border border-gray-400 rounded p-2" />
        </div>

        <div>
          <label className="text-sm block mb-1 font-medium">{t('clientForm.contractFile')}</label>
          <input type="file" name="contract_file" accept=".pdf,.png,.jpg,.jpeg" className="block text-sm" />
          {client?.contract_file_path && (
            <p className="text-xs text-gray-600 mt-1">{t('clientForm.fileUploaded')}</p>
          )}
        </div>
      </div>

      <SubmitButton>{t('common.save')}</SubmitButton>
    </form>
  );
}
