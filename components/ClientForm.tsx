import type { Client } from '@/types/db';
import PhoneInput from '@/components/PhoneInput';
import SubmitButton from '@/components/SubmitButton';
import AddressSearch from '@/components/AddressSearch';


export default function ClientForm({ client, action }: { client?: Client; action: (fd: FormData) => void }) {
  return (
    <form action={action} className="bg-white p-6 rounded-lg shadow space-y-4 max-w-2xl">
      {client && <input type="hidden" name="id" defaultValue={client.id} />}
      <Field name="company_name" label="업체명 *" required defaultValue={client?.company_name} />
      <div className="grid grid-cols-2 gap-4">
        <Field name="contact_person" label="담당자" defaultValue={client?.contact_person ?? ''} />
        <div>
          <label className="text-sm block mb-1">연락처</label>
          <PhoneInput name="phone" defaultValue={client?.phone ?? ''} />
        </div>
      </div>
      <Field name="email" label="이메일" type="email" defaultValue={client?.email ?? ''} />
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
      <div>
        <label className="text-sm block mb-1">상태</label>
        <select name="status" defaultValue={client?.status ?? 'active'} className="w-full border rounded p-2">
          <option value="active">진행중</option>
          <option value="paused">보류</option>
          <option value="ended">종료</option>
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Field name="contract_start" label="계약일" type="date" defaultValue={client?.contract_start ?? ''} />
        <Field name="contract_end" label="종료일" type="date" defaultValue={client?.contract_end ?? ''} />
      </div>
      <Field name="contract_amount" label="계약금액" type="number" defaultValue={client?.contract_amount ?? ''} />
      <div>
        <label className="text-sm block mb-1">비고</label>
        <textarea name="memo" defaultValue={client?.memo ?? ''} className="w-full border rounded p-2" rows={3} />
      </div>
      <div>
        <label className="text-sm block mb-1">계약서 (PDF/PNG/JPG)</label>
        <input type="file" name="contract_file" accept=".pdf,.png,.jpg,.jpeg" />
        {client?.contract_file_path && <p className="text-xs text-gray-500 mt-1">기존: {client.contract_file_path}</p>}
      </div>
      <SubmitButton>저장</SubmitButton>
    </form>
  );
}

function Field({ name, label, type = 'text', defaultValue, required }: any) {
  return (
    <div>
      <label className="text-sm block mb-1">{label}</label>
      <input name={name} type={type} defaultValue={defaultValue ?? ''} required={required}
        className="w-full border rounded p-2" />
    </div>
  );
}