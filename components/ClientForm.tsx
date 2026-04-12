import type { Client, ClientStatus } from '@/types/db';
import SubmitButton from '@/components/SubmitButton';
import PhoneInput from '@/components/PhoneInput';
import AddressSearch from '@/components/AddressSearch';
import ChipSelect from '@/components/ChipSelect';

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
  const statusOptions: { value: ClientStatus; label: string }[] = [
    { value: 'contacted', label: '접촉완료' },
    { value: 'proposed', label: '제안/미팅' },
    { value: 'negotiating', label: '협상중' },
    { value: 'active', label: '진행중' },
    { value: 'paused', label: '보류' },
    { value: 'ended', label: '종료' },
  ];

  return (
    <form action={action} className="bg-white p-6 rounded-lg shadow space-y-6 max-w-3xl">
      {client && <input type="hidden" name="id" defaultValue={client.id} />}

      {/* 기본 정보 */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold border-b border-gray-300 pb-1">기본 정보</h2>

        <div>
          <label className="text-sm block mb-1 font-medium">업체명 *</label>
          <input name="company_name" defaultValue={client?.company_name ?? ''} required
            className="w-full border border-gray-400 rounded p-2" />
        </div>

        <ChipSelect name="category" label="카테고리" kind="category"
          options={options.categories} defaultValue={client?.category ?? ''} />

        <ChipSelect name="sales_region" label="지역" kind="sales_region"
          options={options.regions} defaultValue={client?.sales_region ?? ''} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm block mb-1 font-medium">담당자(업체)</label>
            <input name="contact_person" defaultValue={client?.contact_person ?? ''}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">연락처</label>
            <PhoneInput name="phone" defaultValue={client?.phone ?? ''} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm block mb-1 font-medium">이메일</label>
            <input type="email" name="email" defaultValue={client?.email ?? ''}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
        </div>

        <div>
          <label className="text-sm block mb-2 font-medium">주소</label>
          <AddressSearch
            defaultPostal={client?.postal_code ?? ''}
            defaultRegion={client?.region ?? ''}
            defaultDistrict={client?.district ?? ''}
            defaultRoad={client?.road_address ?? ''}
            defaultDetail={client?.building_detail ?? ''}
          />
        </div>
      </div>

      {/* 영업 정보 */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold border-b border-gray-300 pb-1">영업 정보</h2>

        <div>
          <label className="text-sm block mb-1 font-medium">상태 *</label>
          <select name="status" defaultValue={client?.status ?? 'contacted'} required
            className="w-full border border-gray-400 rounded p-2">
            {statusOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm block mb-1 font-medium">최초접촉일</label>
          <input type="date" name="first_contact_date"
            defaultValue={client?.first_contact_date ?? ''}
            className="w-full border border-gray-400 rounded p-2 max-w-xs" />
        </div>

        <ChipSelect name="contract_product" label="계약상품" kind="product"
          options={options.products} defaultValue={client?.contract_product ?? ''} />

        <div>
          <label className="text-sm block mb-1 font-medium">계약금액</label>
          <input type="number" name="contract_amount"
            defaultValue={client?.contract_amount ?? ''}
            className="w-full border border-gray-400 rounded p-2 max-w-xs" />
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="text-sm block mb-1 font-medium">계약일</label>
            <input type="date" name="contract_start"
              defaultValue={client?.contract_start ?? ''}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">종료일</label>
            <input type="date" name="contract_end"
              defaultValue={client?.contract_end ?? ''}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
        </div>

        <div>
          <label className="text-sm block mb-1 font-medium">담당자 (관리자)</label>
          <select name="owner_id"
            defaultValue={client?.owner_id ?? currentUserId}
            className="w-full border border-gray-400 rounded p-2 max-w-xs">
            {admins.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 메모 + 파일 */}
      <div className="space-y-4">
        <div>
          <label className="text-sm block mb-1 font-medium">메모</label>
          <textarea name="memo" defaultValue={client?.memo ?? ''} rows={3}
            className="w-full border border-gray-400 rounded p-2" />
        </div>

        <div>
          <label className="text-sm block mb-1 font-medium">계약서 (PDF/PNG/JPG)</label>
          <input type="file" name="contract_file" accept=".pdf,.png,.jpg,.jpeg" className="block text-sm" />
          {client?.contract_file_path && (
            <p className="text-xs text-gray-600 mt-1">기존 파일 업로드됨</p>
          )}
        </div>
      </div>

      <SubmitButton>저장</SubmitButton>
    </form>
  );
}