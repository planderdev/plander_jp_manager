import { createClient } from '@/lib/supabase/server';
import { updateAdminAction } from '@/actions/admins';
import { notFound } from 'next/navigation';
import SubmitButton from '@/components/SubmitButton';
import PhoneInput from '@/components/PhoneInput';
import BackButton from '@/components/BackButton';

export default async function EditAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: admin } = await sb.from('admins').select('*').eq('id', id).single();
  if (!admin) notFound();

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">관리자 수정</h1>
      <form action={updateAdminAction} className="bg-white p-6 rounded-lg shadow space-y-4 max-w-2xl">
        <input type="hidden" name="id" defaultValue={admin.id} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm block mb-1 font-medium">담당자명 *</label>
            <input name="name" defaultValue={admin.name} required className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">소속</label>
            <input name="company" defaultValue={admin.company ?? ''} className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">직함</label>
            <input name="title" defaultValue={admin.title ?? ''} className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">휴대폰번호</label>
            <PhoneInput name="phone" defaultValue={admin.phone ?? ''} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm block mb-1 font-medium">이메일 (변경 불가)</label>
            <input value={admin.email} disabled className="w-full border border-gray-300 rounded p-2 bg-gray-100" />
          </div>
        </div>
        <div className="flex gap-3">
          <SubmitButton>저장</SubmitButton>
          <BackButton />
        </div>
      </form>
    </div>
  );
}