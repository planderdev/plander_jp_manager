'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateReportPdf } from '@/lib/pdf/reportTemplate';

export async function generateReportAction(fd: FormData) {
  const clientId = Number(fd.get('client_id'));
  const yearMonth = String(fd.get('year_month'));  // '2026-04'
  if (!clientId || !yearMonth) throw new Error('필수값 누락');

  const sb = await createClient();
  const { data: client } = await sb.from('clients').select('*').eq('id', clientId).single();
  if (!client) throw new Error('업체 없음');

  const start = `${yearMonth}-01T00:00:00+09:00`;
  const [y, m] = yearMonth.split('-').map(Number);
  const nextMonth = new Date(y, m, 1);  // m이 0-based 다음달이라 그대로 OK
  const endStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth()+1).padStart(2,'0')}-01T00:00:00+09:00`;

  const { data: posts } = await sb.from('posts')
    .select('*, influencers(handle), created_at')
    .eq('client_id', clientId)
    .gte('created_at', start)
    .lt('created_at', endStr)
    .not('post_url', 'is', null);

  const pdfBuffer = await generateReportPdf({ client, month: yearMonth, posts: posts ?? [] });

  const fileName = `${client.company_name}_${yearMonth}.pdf`;
  const filePath = `${clientId}/${yearMonth}.pdf`;

  const { error: upErr } = await sb.storage.from('reports')
    .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });
  if (upErr) throw new Error(upErr.message);

  await sb.from('reports').upsert({
    client_id: clientId, year_month: yearMonth, file_name: fileName, file_path: filePath,
  }, { onConflict: 'client_id,year_month' });

  revalidatePath('/extras/reports');
}

export async function deleteReportAction(id: number) {
  const sb = await createClient();
  const { data: r } = await sb.from('reports').select('file_path').eq('id', id).single();
  if (r) await sb.storage.from('reports').remove([r.file_path]);
  await sb.from('reports').delete().eq('id', id);
  revalidatePath('/extras/reports');
}

export async function getReportDownloadUrl(filePath: string) {
  const sb = await createClient();
  const { data } = await sb.storage.from('reports').createSignedUrl(filePath, 600);
  return data?.signedUrl ?? null;
}