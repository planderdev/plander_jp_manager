'use server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createAdminAction(fd: FormData) {
  const email = String(fd.get('email') || '');
  const password = String(fd.get('password') || '');
  const name = String(fd.get('name') || '');
  const company = String(fd.get('company') || '') || null;
  const title = String(fd.get('title') || '') || null;
  const phone = String(fd.get('phone') || '') || null;

  if (!email || !password || !name) throw new Error('필수값 누락');
  if (password.length < 6) throw new Error('비밀번호는 최소 6자');

  // 현재 로그인 확인
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // service role 클라이언트로 유저 생성 (Auto Confirm)
  const admin = createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: created, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (error) throw new Error(error.message);

  const { error: profileErr } = await sb.from('admins').insert({
    id: created.user.id,
    name, email, company, title, phone,
  });
  if (profileErr) throw new Error(profileErr.message);

  revalidatePath('/extras/admins');
  redirect('/extras/admins');
}