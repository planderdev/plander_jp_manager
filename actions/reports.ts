'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateReportPdf } from '@/lib/pdf/reportTemplate';

export async function generateReportAction(formData: FormData) {
  const sb = await createClient();
  const clientId = Number(formData.get('client_id'));
  const yearMonth = String(formData.get('year_month'));

  // 1. 기간 계산 (해당 월 1일 ~ 다음 달 1일)
  const [yr, mo] = yearMonth.split('-').map(Number);
  const start = `${yearMonth}-01T00:00:00+09:00`;
  const nextMonth = new Date(yr, mo, 1);
  const endStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01T00:00:00+09:00`;
  const prevDate = new Date(yr, mo - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  // 2. 클라이언트 정보
  const { data: client } = await sb.from('clients').select('*').eq('id', clientId).single();
  if (!client) throw new Error('클라이언트를 찾을 수 없습니다');

  // 3. 스케줄 + 게시물
  const { data: schedules } = await sb.from('schedules')
    .select('id, scheduled_at, influencers(handle, channel), posts(id, post_url, uploaded_on)')
    .eq('client_id', clientId)
    .gte('scheduled_at', start)
    .lt('scheduled_at', endStr)
    .order('scheduled_at', { ascending: true });

  // 4. 메트릭 히스토리 (이번 달 + 전월)
  const postIds = (schedules ?? []).flatMap((s: any) => s.posts?.map((p: any) => p.id) ?? []);
  const [thisHistRes, prevHistRes] = await Promise.all([
    postIds.length
      ? sb.from('post_metrics_history').select('*').in('post_id', postIds).eq('month', yearMonth)
      : Promise.resolve({ data: [] as any[] }),
    postIds.length
      ? sb.from('post_metrics_history').select('*').in('post_id', postIds).eq('month', prevMonth)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const thisHist = thisHistRes.data ?? [];
  const prevHist = prevHistRes.data ?? [];

  // 5. PDF 생성
  const pdfBuffer = await generateReportPdf({
    client,
    month: yearMonth,
    schedules: schedules ?? [],
    thisHist,
    prevHist,
    prevMonth,
  });

  // 6. Storage 업로드
  const filePath = `${clientId}/${yearMonth}.pdf`;
  const { error: upErr } = await sb.storage.from('reports')
    .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });
  if (upErr) throw new Error(upErr.message);

  // 7. DB 기록
  await sb.from('reports').upsert({
    client_id: clientId,
    year_month: yearMonth,
    file_path: filePath,
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