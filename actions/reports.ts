'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateReportPdf } from '@/lib/pdf/reportTemplate';

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

    console.log('[REPORT] start', { clientId, yearMonth, start, endStr });

    const { data: client, error: ce } = await sb.from('clients').select('*').eq('id', clientId).single();
    if (ce) { console.error('[REPORT] client error', ce); throw new Error('client: ' + ce.message); }
    if (!client) throw new Error('클라이언트 없음');

    const { data: schedules, error: se } = await sb.from('schedules')
      .select('id, scheduled_at, influencers(handle, channel), posts(id, post_url, uploaded_on)')
      .eq('client_id', clientId)
      .gte('scheduled_at', start)
      .lt('scheduled_at', endStr)
      .order('scheduled_at', { ascending: true });
    if (se) { console.error('[REPORT] schedules error', se); throw new Error('schedules: ' + se.message); }
    console.log('[REPORT] schedules count', schedules?.length);

    const postIds = (schedules ?? []).flatMap((s: any) => s.posts?.map((p: any) => p.id) ?? []);
    console.log('[REPORT] postIds', postIds);

    let thisHist: any[] = [];
    let prevHist: any[] = [];
    if (postIds.length) {
      const [a, b] = await Promise.all([
        sb.from('post_metrics_history').select('*').in('post_id', postIds).eq('month', yearMonth),
        sb.from('post_metrics_history').select('*').in('post_id', postIds).eq('month', prevMonth),
      ]);
      if (a.error) { console.error('[REPORT] thisHist error', a.error); throw new Error('thisHist: ' + a.error.message); }
      if (b.error) { console.error('[REPORT] prevHist error', b.error); throw new Error('prevHist: ' + b.error.message); }
      thisHist = a.data ?? [];
      prevHist = b.data ?? [];
    }

    console.log('[REPORT] generating PDF');
    const pdfBuffer = await generateReportPdf({
      client, month: yearMonth, schedules: schedules ?? [],
      thisHist, prevHist, prevMonth,
    });
    console.log('[REPORT] PDF size', pdfBuffer.length);

    const filePath = `${clientId}/${yearMonth}.pdf`;
    const { error: upErr } = await sb.storage.from('reports')
      .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });
    if (upErr) { console.error('[REPORT] upload error', upErr); throw new Error('upload: ' + upErr.message); }
    console.log('[REPORT] uploaded');

    const { error: dbErr } = await sb.from('reports').upsert({
      client_id: clientId,
      year_month: yearMonth,
      file_path: filePath,
    }, { onConflict: 'client_id,year_month' });
    if (dbErr) { console.error('[REPORT] db error', dbErr); throw new Error('db: ' + dbErr.message); }
    console.log('[REPORT] done');

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
  revalidatePath('/extras/reports');
}

export async function getReportDownloadUrl(filePath: string) {
  const sb = await createClient();
  const { data } = await sb.storage.from('reports').createSignedUrl(filePath, 600);
  return data?.signedUrl ?? null;
}