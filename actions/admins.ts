'use server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { setFlashMessage } from '@/lib/flash';

export async function createAdminAction(fd: FormData) {
  const email = String(fd.get('email') || '');
  const password = String(fd.get('password') || '');
  const passwordConfirm = String(fd.get('password_confirm') || '');
  const duplicateCheckedEmail = String(fd.get('duplicate_checked_email') || '').trim().toLowerCase();
  const name = String(fd.get('name') || '');
  const company = String(fd.get('company') || '') || null;
  const title = String(fd.get('title') || '') || null;
  const phone = String(fd.get('phone') || '') || null;

  if (!email || !password || !name) throw new Error('필수값 누락');
  if (password.length < 6) throw new Error('비밀번호는 최소 6자');
  if (password !== passwordConfirm) throw new Error('비밀번호 확인이 일치하지 않습니다');
  if (duplicateCheckedEmail !== email.trim().toLowerCase()) throw new Error('이메일 중복확인을 다시 해주세요');

  // 현재 로그인 확인
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // service role 클라이언트로 유저 생성 (Auto Confirm)
  const admin = createAdminClient();

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    if (error.message.includes('already') || error.message.includes('exists') || error.message.includes('registered')) {
      throw new Error('이미 등록된 이메일입니다');
    }
    throw new Error(error.message);
  }

  const { error: profileErr } = await sb.from('admins').insert({
    id: created.user.id,
    name, email, company, title, phone,
  });
  if (profileErr) throw new Error(profileErr.message);

  await setFlashMessage({ title: '작업 완료', body: '관리자가 등록되었습니다.' });
  revalidatePath('/extras/admins');
  redirect('/extras/admins');
}

export async function updateAdminAction(fd: FormData) {
  const id = String(fd.get('id'));
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const payload = {
    name: String(fd.get('name') || ''),
    company: String(fd.get('company') || '') || null,
    title: String(fd.get('title') || '') || null,
    phone: String(fd.get('phone') || '') || null,
  };

  const { error } = await sb.from('admins').update(payload).eq('id', id);
  if (error) throw new Error(error.message);

  await setFlashMessage({ title: '작업 완료', body: '관리자 정보가 저장되었습니다.' });
  revalidatePath('/extras/admins');
  redirect('/extras/admins');
}

export async function deleteAdminAction(id: string) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  if (user.id === id) throw new Error('자기 자신은 삭제할 수 없습니다');

  // service role로 auth 유저 삭제
  const adminSb = createAdminClient();
  await adminSb.auth.admin.deleteUser(id);
  // admins 테이블은 cascade 안 걸려있으면 직접 삭제
  await sb.from('admins').delete().eq('id', id);

  await setFlashMessage({ title: '작업 완료', body: '관리자가 삭제되었습니다.' });
  revalidatePath('/extras/admins');
}
