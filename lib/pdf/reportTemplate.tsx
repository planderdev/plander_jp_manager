import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer';
import path from 'path';

Font.register({
  family: 'NotoKR',
  src: path.join(process.cwd(), 'public/fonts/NotoSansKR-Regular.ttf'),
});

const s = StyleSheet.create({
  page: { padding: 36, fontFamily: 'NotoKR', fontSize: 10 },
  h1: { fontSize: 18, marginBottom: 6 },
  sub: { fontSize: 10, color: '#555', marginBottom: 12 },
  box: { border: 1, borderColor: '#ccc', padding: 8, marginBottom: 12 },
  row: { flexDirection: 'row', borderBottom: 1, borderColor: '#eee', paddingVertical: 6 },
  head: { backgroundColor: '#eee', fontWeight: 'bold' as any },
  cName: { width: '18%' },
  cDate: { width: '14%' },
  cUpload: { width: '14%' },
  cChannel: { width: '14%' },
  cStatus: { width: '10%' },
  cNum: { width: '10%', textAlign: 'right' as any },
});

export function ReportDoc({ client, month, schedules, thisHist, prevHist, prevMonth }: any) {
  const histMap = new Map<number, any>();
  for (const h of thisHist) histMap.set(h.post_id, h);
  const prevMap = new Map<number, any>();
  for (const h of prevHist) prevMap.set(h.post_id, h);

  const sumKey = (arr: any[], k: string) => arr.reduce((a, r) => a + (r[k] ?? 0), 0);
  const tv = sumKey(thisHist, 'views');
  const tl = sumKey(thisHist, 'likes');
  const tc = sumKey(thisHist, 'comments');
  const ts = sumKey(thisHist, 'shares');
  const pv = sumKey(prevHist, 'views');
  const pl = sumKey(prevHist, 'likes');

  const fmt = (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? `+${cur.toLocaleString()} (신규)` : '-';
    const diff = cur - prev;
    const pct = ((diff / prev) * 100).toFixed(1);
    return `${diff >= 0 ? '+' : ''}${diff.toLocaleString()} (${pct}%)`;
  };

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>{client.company_name} - {month} 월간 리포트</Text>
        <Text style={s.sub}>담당자: {client.contact_person ?? '-'} · 연락처: {client.phone ?? '-'}</Text>

        <View style={s.box}>
          <Text>전체 스케줄: {schedules.length}건</Text>
          <Text>총 조회: {tv.toLocaleString()}   총 좋아요: {tl.toLocaleString()}   총 댓글: {tc.toLocaleString()}   총 공유: {ts.toLocaleString()}</Text>
          <Text>전월({prevMonth}) 대비 — 조회 {fmt(tv, pv)}   좋아요 {fmt(tl, pl)}</Text>
        </View>

        <View style={[s.row, s.head]}>
          <Text style={s.cName}>인플루언서</Text>
          <Text style={s.cChannel}>채널</Text>
          <Text style={s.cDate}>촬영일</Text>
          <Text style={s.cUpload}>업로드일</Text>
          <Text style={s.cStatus}>업로드</Text>
          <Text style={s.cNum}>조회</Text>
          <Text style={s.cNum}>좋아요</Text>
          <Text style={s.cNum}>댓글</Text>
        </View>
        {schedules.map((s2: any) => {
          const p = s2.posts?.find((p: any) => p.post_url);
          const uploaded = !!p;
          const h = p ? histMap.get(p.id) : null;
          const d = new Date(s2.scheduled_at);
          const dateStr = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
          const uploadStr = p?.uploaded_on
            ? p.uploaded_on.replaceAll('-','/')
            : '-';
          return (
            <View key={s2.id} style={s.row}>
              <Text style={s.cName}>@{s2.influencers?.handle}</Text>
              <Text style={s.cChannel}>{s2.influencers?.channel ?? '-'}</Text>
              <Text style={s.cDate}>{dateStr}</Text>
              <Text style={s.cUpload}>{uploadStr}</Text>
              <Text style={s.cStatus}>{uploaded ? 'O' : 'X'}</Text>
              <Text style={s.cNum}>{(h?.views ?? 0).toLocaleString()}</Text>
              <Text style={s.cNum}>{(h?.likes ?? 0).toLocaleString()}</Text>
              <Text style={s.cNum}>{(h?.comments ?? 0).toLocaleString()}</Text>
            </View>
          );
        })}
      </Page>
    </Document>
  );
}

export async function generateReportPdf(data: any): Promise<Buffer> {
  return await renderToBuffer(<ReportDoc {...data} />) as Buffer;
}