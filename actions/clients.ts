'use server';
import { createClient as createSupabase } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function parseClientPayload(formData: FormData) {
  return {
    company_name: String(formData.get('company_name') || ''),
    store_name_ja: String(formData.get('store_name_ja') || '') || null,
    contact_person: String(formData.get('contact_person') || '') || null,
    phone: String(formData.get('phone') || '') || null,
    email: String(formData.get('email') || '') || null,
    status: String(formData.get('status') || 'contacted') as any,
    contract_start: String(formData.get('contract_start') || '') || null,
    contract_end: String(formData.get('contract_end') || '') || null,
    contract_amount: Number(formData.get('contract_amount')) || null,
    memo: String(formData.get('memo') || '') || null,
    postal_code: String(formData.get('postal_code') || '') || null,
    region: String(formData.get('region') || '') || null,
    district: String(formData.get('district') || '') || null,
    road_address: String(formData.get('road_address') || '') || null,
    building_detail: String(formData.get('building_detail') || '') || null,
    address_ja: String(formData.get('address_ja') || '') || null,
    business_hours: String(formData.get('business_hours') || '') || null,
    provided_menu: String(formData.get('provided_menu') || '') || null,
    category: String(formData.get('category') || '') || null,
    sales_region: String(formData.get('sales_region') || '') || null,
    first_contact_date: String(formData.get('first_contact_date') || '') || null,
    contract_product: String(formData.get('contract_product') || '') || null,
    owner_id: String(formData.get('owner_id') || '') || null,
  };
}

async function getAuthAdmin() {
  const sb = await createSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: admin } = await sb.from('admins').select('name').eq('id', user.id).single();
  return { sb, user, admin };
}

export async function createClientAction(formData: FormData) {
  const sb = await createSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: admin } = await sb.from('admins').select('name').eq('id', user.id).single();

  const payload = {
    ...parseClientPayload(formData),
    manager_id: user.id,
    manager_name: admin?.name ?? null,
  };
  // owner_id가 비어있으면 현재 유저로
  if (!payload.owner_id) payload.owner_id = user.id;

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

  revalidatePath('/sales');
  revalidatePath('/campaigns/clients');
  redirect(`/campaigns/clients/${inserted.id}`);
}

export async function updateClientAction(formData: FormData) {
  const sb = await createSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const id = Number(formData.get('id'));

  // 권한 체크: 담당자 본인 또는 담당자 없는 경우만 수정 가능
  const { data: existing } = await sb.from('clients')
    .select('owner_id').eq('id', id).single();
  if (!existing) throw new Error('존재하지 않는 클라이언트');
  if (existing.owner_id && existing.owner_id !== user.id) {
    throw new Error('이 클라이언트를 수정할 권한이 없습니다');
  }

  const payload = parseClientPayload(formData);

  const { error } = await sb.from('clients').update(payload).eq('id', id);
  if (error) throw new Error(error.message);

  const file = formData.get('contract_file') as File | null;
  if (file && file.size > 0) {
    const path = `${id}/${Date.now()}_${file.name}`;
    await sb.storage.from('contracts').upload(path, file);
    await sb.from('clients').update({ contract_file_path: path }).eq('id', id);
  }

  revalidatePath('/sales');
  revalidatePath('/campaigns/clients');
  redirect(`/campaigns/clients/${id}`);
}

export async function deleteClientAction(id: number) {
  const sb = await createSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: existing } = await sb.from('clients')
    .select('owner_id').eq('id', id).single();
  if (existing?.owner_id && existing.owner_id !== user.id) {
    throw new Error('이 클라이언트를 삭제할 권한이 없습니다');
  }

  const { error } = await sb.from('clients').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/sales');
  revalidatePath('/campaigns/clients');
}
