'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateReportPdf } from '@/lib/pdf/reportTemplate';
import { setFlashMessage } from '@/lib/flash';

export async function generateReportAction(formData: FormData) {
  try {
    const sb = await createClient();
    const clientId = Number(formData.get('client_id'));
    const yearMonth = String(formData.get('year_month'));

    const [yr, mo] = yearMonth.split('-').map(Number);
    const start = `${yearMonth}-01T00:00:00+09:00`;
    const nextMonth = new Date(yr, mo, 1);
    const endStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01T00:00:00+09:00`;
    const prevDate = new Date(yr, mo - 2, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const { data: client, error: ce } = await sb.from('clients').select('*').eq('id', clientId).single();
    if (ce) throw new Error('client: ' + ce.message);
    if (!client) throw new Error('클라이언트 없음');

    const { data: schedules, error: se } = await sb.from('schedules')
      .select('id, scheduled_at, influencers(handle, channel), posts(id, post_url, uploaded_on)')
      .eq('client_id', clientId)
      .gte('scheduled_at', start)
      .lt('scheduled_at', endStr)
      .order('scheduled_at', { ascending: true });
    if (se) throw new Error('schedules: ' + se.message);

    const postIds = (schedules ?? []).flatMap((s: any) => s.posts?.map((p: any) => p.id) ?? []);

    let thisHist: any[] = [];
    let prevHist: any[] = [];
    if (postIds.length) {
      const [a, b] = await Promise.all([
        sb.from('post_metrics_history').select('*').in('post_id', postIds).eq('month', yearMonth),
        sb.from('post_metrics_history').select('*').in('post_id', postIds).eq('month', prevMonth),
      ]);
      if (a.error) throw new Error('thisHist: ' + a.error.message);
      if (b.error) throw new Error('prevHist: ' + b.error.message);
      thisHist = a.data ?? [];
      prevHist = b.data ?? [];
    }

    const pdfBuffer = await generateReportPdf({
      client, month: yearMonth, schedules: schedules ?? [],
      thisHist, prevHist, prevMonth,
    });

    const filePath = `${clientId}/${yearMonth}.pdf`;
    const { error: upErr } = await sb.storage.from('reports')
      .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });
    if (upErr) throw new Error('upload: ' + upErr.message);

    const { error: dbErr } = await sb.from('reports').upsert({
      client_id: clientId,
      year_month: yearMonth,
      file_path: filePath,
      file_name: `${yearMonth}.pdf`,
    }, { onConflict: 'client_id,year_month' });
    if (dbErr) throw new Error('db: ' + dbErr.message);

    await setFlashMessage({ title: '작업 완료', body: '월별 통계 PDF를 만들었어.' });
    revalidatePath('/extras/reports');
  } catch (e: any) {
    console.error('[REPORT] FATAL', e);
    throw new Error('보고서 생성 실패: ' + (e?.message ?? 'unknown'));
  }
}

export async function deleteReportAction(id: number) {
  const sb = await createClient();
  const { data: r } = await sb.from('reports').select('file_path').eq('id', id).single();
  if (r) await sb.storage.from('reports').remove([r.file_path]);
  await sb.from('reports').delete().eq('id', id);
  await setFlashMessage({ title: '작업 완료', body: '월별 통계 PDF를 삭제했어.' });
  revalidatePath('/extras/reports');
}

export async function getReportDownloadUrl(filePath: string) {
  const sb = await createClient();
  const { data } = await sb.storage.from('reports').createSignedUrl(filePath, 600);
  return data?.signedUrl ?? null;
}
