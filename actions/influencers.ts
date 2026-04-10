'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function parsePayload(fd: FormData) {
  return {
    channel: String(fd.get('channel') || 'instagram') as any,
    handle: String(fd.get('handle') || ''),
    followers: Number(fd.get('followers')) || 0,
    account_url: String(fd.get('account_url') || '') || null,
    unit_price: Number(fd.get('unit_price')) || null,
    memo: String(fd.get('memo') || '') || null,
    name_en: String(fd.get('name_en') || '').toUpperCase() || null,
    bank_name: String(fd.get('bank_name') || '') || null,
    branch_name: String(fd.get('branch_name') || '') || null,
    account_number: String(fd.get('account_number') || '') || null,
    phone: String(fd.get('phone') || '') || null,
    postal_code: String(fd.get('postal_code') || '') || null,
    prefecture: String(fd.get('prefecture') || '') || null,
    city: String(fd.get('city') || '') || null,
    street: String(fd.get('street') || '') || null,
    contact_status: String(fd.get('contact_status') || 'active') as any,
  };
}

export async function createInfluencerAction(fd: FormData) {
  const sb = await createClient();
  const { error } = await sb.from('influencers').insert(parsePayload(fd));
  if (error) throw new Error(error.message);
  revalidatePath('/influencers');
  redirect('/influencers');
}

export async function updateInfluencerAction(fd: FormData) {
  const sb = await createClient();
  const id = Number(fd.get('id'));
  const { error } = await sb.from('influencers').update(parsePayload(fd)).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/influencers');
  redirect('/influencers');
}

export async function deleteInfluencerAction(id: number) {
  const sb = await createClient();
  const { error } = await sb.from('influencers').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/influencers');
}