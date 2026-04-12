'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type OptionKind = 'category' | 'sales_region' | 'product';

export async function getClientOptions() {
  const sb = await createClient();
  const { data } = await sb.from('client_options').select('*').order('value');
  const all = data ?? [];
  return {
    categories: all.filter(o => o.kind === 'category'),
    regions: all.filter(o => o.kind === 'sales_region'),
    products: all.filter(o => o.kind === 'product'),
  };
}

export async function addClientOption(kind: OptionKind, value: string) {
  const v = value.trim();
  if (!v) return { error: '값이 비어있습니다' };

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await sb.from('client_options')
    .insert({ kind, value: v });
  if (error) {
    if (error.code === '23505') return { error: '이미 있는 항목입니다' };
    return { error: error.message };
  }

  revalidatePath('/sales');
  revalidatePath('/sales/new');
  revalidatePath('/campaigns/clients');
  return { ok: true };
}

export async function removeClientOption(id: number) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await sb.from('client_options').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/sales');
  revalidatePath('/sales/new');
  revalidatePath('/campaigns/clients');
  return { ok: true };
}