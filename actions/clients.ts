'use server';
import { createClient as createSupabase } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function getAuthAdmin() {
  const sb = await createSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: admin } = await sb.from('admins').select('name').eq('id', user.id).single();
  return { sb, user, admin };
}

export async function createClientAction(formData: FormData) {
  const { sb, user, admin } = await getAuthAdmin();

  const payload = {
    company_name: String(formData.get('company_name') || ''),
    contact_person: String(formData.get('contact_person') || '') || null,
    phone: String(formData.get('phone') || '') || null,
    email: String(formData.get('email') || '') || null,
    status: (String(formData.get('status') || 'active')) as any,
    contract_start: String(formData.get('contract_start') || '') || null,
    contract_end: String(formData.get('contract_end') || '') || null,
    contract_amount: Number(formData.get('contract_amount')) || null,
    memo: String(formData.get('memo') || '') || null,
    manager_id: user.id,
    manager_name: admin?.name ?? null,
  };

  const { data: inserted, error } = await sb.from('clients').insert(payload).select().single();
  if (error) {
    if (error.code === '23505') throw new Error('이미 등록된 업체명입니다');
    throw new Error(error.message);
  }

  const file = formData.get('contract_file') as File | null;
  if (file && file.size > 0) {
    const path = `${inserted.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await sb.storage.from('contracts').upload(path, file);
    if (!upErr) {
      await sb.from('clients').update({ contract_file_path: path }).eq('id', inserted.id);
    }
  }

  revalidatePath('/campaigns/clients');
  redirect('/campaigns/clients');
}

export async function updateClientAction(formData: FormData) {
  const { sb } = await getAuthAdmin();
  const id = Number(formData.get('id'));

  const payload = {
    company_name: String(formData.get('company_name') || ''),
    contact_person: String(formData.get('contact_person') || '') || null,
    phone: String(formData.get('phone') || '') || null,
    email: String(formData.get('email') || '') || null,
    status: String(formData.get('status') || 'active') as any,
    contract_start: String(formData.get('contract_start') || '') || null,
    contract_end: String(formData.get('contract_end') || '') || null,
    contract_amount: Number(formData.get('contract_amount')) || null,
    memo: String(formData.get('memo') || '') || null,
  };

  const { error } = await sb.from('clients').update(payload).eq('id', id);
  if (error) throw new Error(error.message);

  const file = formData.get('contract_file') as File | null;
  if (file && file.size > 0) {
    const path = `${id}/${Date.now()}_${file.name}`;
    await sb.storage.from('contracts').upload(path, file);
    await sb.from('clients').update({ contract_file_path: path }).eq('id', id);
  }

  revalidatePath('/campaigns/clients');
  redirect('/campaigns/clients');
}

export async function deleteClientAction(id: number) {
  const { sb } = await getAuthAdmin();
  const { error } = await sb.from('clients').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/campaigns/clients');
}