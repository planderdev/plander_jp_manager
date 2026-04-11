import { createClient } from '@/lib/supabase/server';
import { createAdminAction } from '@/actions/admins';
import PhoneInput from '@/components/PhoneInput';
import SubmitButton from '@/components/SubmitButton';
import { saveApifyTokenAction, getApifyTokenStatus } from '@/actions/settings';
import { syncAllPosts } from '@/actions/sync-metrics';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { deleteAdminAction } from '@/actions/admins';

export default async function AdminsPage() {
  const sb = await createClient();
  const { data: admins } = await sb.from('admins').select('*').order('created_at', { ascending: false });
  const tokenStatus = await getApifyTokenStatus();

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
                <th className="p-3">관리</th>
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
                  <td className="p-3 space-x-2">
                    <Link href={`/extras/admins/${a.id}`} className="text-blue-600">수정</Link>
                    <form action={async () => {
                      'use server';
                      await deleteAdminAction(a.id);
                    }} className="inline">
                      <button className="text-red-500"
                        formAction={async () => { 'use server'; await deleteAdminAction(a.id); }}>
                        삭제
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">Apify API 설정</h2>
        <div className="bg-white p-6 rounded-lg shadow space-y-4 max-w-2xl">
          <div className="text-sm text-gray-700">
            <p>인스타그램 게시물 메트릭(좋아요/조회수/댓글) 자동 수집용 Apify 토큰입니다.</p>
            <p className="text-xs text-gray-500 mt-1">
              apify.com → Settings → Integrations → API tokens 에서 발급
            </p>
          </div>
      
          <div className="text-sm">
            현재 상태: {tokenStatus.hasToken
              ? <span className="text-green-600 font-semibold">연동됨 ({tokenStatus.masked})</span>
              : <span className="text-orange-600 font-semibold">미연동 (Mock 모드)</span>}
          </div>
      
          <form action={saveApifyTokenAction} className="space-y-3">
            <div>
              <label className="text-sm block mb-1 font-medium">Apify API Token</label>
              <input type="password" name="apify_token"
                placeholder={tokenStatus.hasToken ? '비워두고 저장하면 삭제됩니다' : 'apify_api_xxxxxxxx'}
                className="w-full border border-gray-400 rounded p-2" />
            </div>
            <SubmitButton>저장</SubmitButton>
          </form>
        </div>
      </section>
      
      <section>
        <h2 className="text-lg font-semibold mb-3">게시물 메트릭 동기화</h2>
        <div className="bg-white p-6 rounded-lg shadow space-y-4 max-w-2xl">
          <div className="text-sm text-gray-700">
            <p>대상: 정산 미완료 + 30일 이내 게시물</p>
            <p className="text-xs text-gray-500 mt-1">
              토큰이 등록된 경우 실제 데이터 수집, 미등록 시 mock 동작 (DB 변경 없음)
            </p>
          </div>
          <form action={async () => {
            'use server';
            const result = await syncAllPosts();
            console.log('[sync result]', result);
            revalidatePath('/influencers/posts');
          }}>
            <SubmitButton>지금 동기화 실행</SubmitButton>
          </form>
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