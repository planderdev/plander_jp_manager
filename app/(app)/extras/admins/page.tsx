import { createClient } from '@/lib/supabase/server';
import { createAdminAction } from '@/actions/admins';
import PhoneInput from '@/components/PhoneInput';
import SubmitButton from '@/components/SubmitButton';

export default async function AdminsPage() {
  const sb = await createClient();
  const { data: admins } = await sb.from('admins').select('*').order('created_at', { ascending: false });

  return (
    <div className="p-4 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold">관리자</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">신규 등록</h2>
        <form action={createAdminAction} className="bg-white p-6 rounded-lg shadow space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <F name="name" label="담당자명 *" required />
            <F name="company" label="소속" />
            <F name="title" label="직함" />
            <div>
              <label className="text-sm block mb-1 font-medium">휴대폰번호</label>
              <PhoneInput name="phone" />
            </div>
            <F name="email" label="이메일 (아이디) *" type="email" required />
            <F name="password" label="비밀번호 (6자 이상) *" type="password" required />
          </div>
          <SubmitButton>등록</SubmitButton>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">관리자 목록</h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">담당자</th>
                <th className="p-3">소속</th>
                <th className="p-3">직함</th>
                <th className="p-3">이메일</th>
                <th className="p-3">휴대폰</th>
                <th className="p-3">등록일</th>
              </tr>
            </thead>
            <tbody>
              {admins?.map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3 font-medium">{a.name}</td>
                  <td className="p-3">{a.company ?? '-'}</td>
                  <td className="p-3">{a.title ?? '-'}</td>
                  <td className="p-3">{a.email}</td>
                  <td className="p-3">{a.phone ?? '-'}</td>
                  <td className="p-3">{new Date(a.created_at).toLocaleDateString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function F({ name, label, type = 'text', required }: any) {
  return (
    <div>
      <label className="text-sm block mb-1 font-medium">{label}</label>
      <input name={name} type={type} required={required}
        className="w-full border border-gray-400 rounded p-2" />
    </div>
  );
}