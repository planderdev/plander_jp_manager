'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateReportPdf } from '@/lib/pdf/reportTemplate';

export async function generateReportAction(formData: FormData) {
  const sb = await createClient();
  const clientId = Number(formData.get('client_id'));
  const yearMonth = String(formData.get('year_month'));

  // 1. 기간 계산
  const start = `${yearMonth}-01T00:00:00+09:00`;
  // ... endStr 등

  // 2. 클라이언트 정보
  const { data: client } = await sb.from('clients').select('*').eq('id', clientId).single();

  // 3. 스케줄 가져오기
  const { data: schedules } = await sb.from('schedules')
    .select('id, scheduled_at, influencers(handle, channel), posts(id, post_url, uploaded_on)')
    .eq('client_id', clientId)
    .gte('scheduled_at', start)
    .lt('scheduled_at', endStr)
    .order('scheduled_at', { ascending: true });

  // 4. 전월 대비
  const [yr, mo] = yearMonth.split('-').map(Number);
  const prevDate = new Date(yr, mo - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const postIds = (schedules ?? []).flatMap((s: any) => s.posts?.map((p: any) => p.id) ?? []);
  const [{ data: thisHist }, { data: prevHist }] = await Promise.all([
    sb.from('post_metrics_history').select('*').in('post_id', postIds).eq('month', yearMonth),
    sb.from('post_metrics_history').select('*').in('post_id', postIds).eq('month', prevMonth),
  ]);

  // 5. PDF 생성  ← 여기서 한 번만
  const pdfBuffer = await generateReportPdf({
    client, month: yearMonth, schedules: schedules ?? [],
    thisHist: thisHist ?? [], prevHist: prevHist ?? [], prevMonth,
  });

  // 6. 업로드
  const filePath = `${clientId}/${yearMonth}.pdf`;
  const { error: upErr } = await sb.storage.from('reports')
    .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });
  if (upErr) throw new Error(upErr.message);

  // 7. DB 기록
  await sb.from('reports').upsert({ ... });

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