import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer';
import path from 'path';

Font.register({
  family: 'NotoKR',
  src: path.join(process.cwd(), 'public/fonts/NotoSansKR-Regular.ttf'),
});

const s = StyleSheet.create({
  page: { padding: 36, fontFamily: 'PretendardJP', fontSize: 10 },
  h1: { fontSize: 18, marginBottom: 6 },
  sub: { fontSize: 10, color: '#555', marginBottom: 12 },
  box: { border: 1, borderColor: '#ccc', padding: 8, marginBottom: 12 },
  row: { flexDirection: 'row', borderBottom: 1, borderColor: '#eee', paddingVertical: 6 },
  head: { backgroundColor: '#eee', fontWeight: 'bold' as any },
  cName: { width: '18%' },
  cDate: { width: '14%' },
  cLink: { width: '36%' },
  cNum: { width: '10.66%', textAlign: 'right' as any },
});

export function ReportDoc({ client, month, posts }: any) {
  const totalViews = posts.reduce((a: number, p: any) => a + (p.views || 0), 0);
  const totalLikes = posts.reduce((a: number, p: any) => a + (p.likes || 0), 0);
  const totalComments = posts.reduce((a: number, p: any) => a + (p.comments || 0), 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>{client.company_name} - {month} 월간 리포트</Text>
        <Text style={s.sub}>담당자: {client.contact_person ?? '-'} · 연락처: {client.phone ?? '-'}</Text>

        <View style={s.box}>
          <Text>총 게시물: {posts.length}건   총 조회수: {totalViews.toLocaleString()}</Text>
          <Text>총 좋아요: {totalLikes.toLocaleString()}   총 댓글: {totalComments.toLocaleString()}</Text>
        </View>

        <View style={[s.row, s.head]}>
          <Text style={s.cName}>인플루언서</Text>
          <Text style={s.cDate}>업로드일</Text>
          <Text style={s.cLink}>게시물 링크</Text>
          <Text style={s.cNum}>조회</Text>
          <Text style={s.cNum}>좋아요</Text>
          <Text style={s.cNum}>댓글</Text>
        </View>
        {posts.map((p: any) => {
          const d = new Date(p.created_at);
          const dateStr = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
          return (
            <View key={p.id} style={s.row}>
              <Text style={s.cName}>@{p.influencers?.handle}</Text>
              <Text style={s.cDate}>{dateStr}</Text>
              <Text style={s.cLink}>{p.post_url ?? '-'}</Text>
              <Text style={s.cNum}>{(p.views ?? 0).toLocaleString()}</Text>
              <Text style={s.cNum}>{(p.likes ?? 0).toLocaleString()}</Text>
              <Text style={s.cNum}>{(p.comments ?? 0).toLocaleString()}</Text>
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