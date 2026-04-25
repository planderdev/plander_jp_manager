import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { getBriefScheduleData } from '@/lib/briefing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function row(label: string, subLabel: string, value: string) {
  return { label, subLabel, value };
}

function countWrappedLines(value: string, charsPerLine: number) {
  return String(value || '')
    .split(/\r?\n/)
    .reduce((total, line) => {
      const clean = line.trim();
      if (!clean) return total + 1;
      return total + Math.max(1, Math.ceil(clean.length / charsPerLine));
    }, 0);
}

function estimateInfoSectionHeight(rows: Array<{ value: string }>) {
  const contentHeight = rows.reduce((total, item) => {
    const lines = countWrappedLines(item.value, 28);
    return total + Math.max(74, 26 + lines * 38);
  }, 0);

  return Math.max(220, contentHeight + 8);
}

function estimateSingleSectionHeight(value: string) {
  const lines = countWrappedLines(value, 34);
  return Math.max(98, 36 + lines * 40);
}

function estimateTextSectionHeight(lines: string[]) {
  const wrappedLines = lines.reduce((total, line) => total + countWrappedLines(line, 42), 0);
  return Math.max(180, 44 + wrappedLines * 42 + Math.max(0, lines.length - 1) * 14);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const brief = await getBriefScheduleData(Number(id));

  if (!brief) {
    return new Response('Not found', { status: 404 });
  }

  const sections = brief.guideSections;
  const regularFontPath = path.join(process.cwd(), 'public', 'fonts', 'PretendardJP-Regular.otf');
  const mediumFontPath = path.join(process.cwd(), 'public', 'fonts', 'PretendardJP-Medium.otf');
  const boldFontPath = path.join(process.cwd(), 'public', 'fonts', 'PretendardJP-Bold.otf');
  const [regularFontData, mediumFontData, boldFontData] = await Promise.all([
    readFile(regularFontPath),
    readFile(mediumFontPath),
    readFile(boldFontPath),
  ]);

  const infoRows = [
    row('店舗名', '', brief.storeNameJa),
    row('住所', '', brief.addressJa),
    row('韓国語の住所', '', brief.addressKo),
    row('営業時間', '', brief.businessHours),
  ];
  const imageHeight =
    96 +
    estimateInfoSectionHeight(infoRows) +
    estimateTextSectionHeight(sections.visit) +
    estimateSingleSectionHeight(brief.providedMenu) +
    estimateSingleSectionHeight(sections.publish) +
    estimateSingleSectionHeight(sections.post) +
    estimateTextSectionHeight(sections.shoot) +
    (brief.additionalRequests ? estimateSingleSectionHeight(brief.additionalRequests) : 0) +
    56;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1240px',
          height: `${imageHeight}px`,
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          color: '#111111',
          fontFamily: 'PretendardJP',
          padding: '28px',
        }}
      >
        <div style={{ display: 'flex', border: '2px solid #1f1f1f', borderBottom: '0' }}>
          <div
            style={{
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              fontSize: 34,
              padding: '18px 24px',
              fontWeight: 700,
            }}
          >
            Instagram Shortform BRIEF (from. {brief.influencerHandle})
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', border: '2px solid #1f1f1f' }}>
          <GuideRow
            title="店舗情報"
            subTitle="매장정보"
            rows={infoRows}
          />
          <GuideTextRow
            title="店舗体験時のお願い"
            subTitle="매장방문 요구사항"
            lines={sections.visit}
          />
          <GuideSingleRow
            title="提供メニュー"
            subTitle="제공메뉴"
            value={brief.providedMenu}
          />
          <GuideSingleRow
            title="投稿時間"
            subTitle="배포시간"
            value={sections.publish}
          />
          <GuideSingleRow
            title="投稿時のお願い事項"
            subTitle="게시 시 요청사항"
            value={sections.post}
          />
          <GuideTextRow
            title="撮影時のお願い事項"
            subTitle="촬영요청사항"
            lines={sections.shoot}
          />
          {brief.additionalRequests ? (
            <GuideSingleRow
              title="追加事項"
              subTitle="추가 요청사항"
              value={brief.additionalRequests}
            />
          ) : null}
        </div>
      </div>
    ),
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
      width: 1240,
      height: imageHeight,
      fonts: [
        {
          name: 'PretendardJP',
          data: regularFontData,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'PretendardJP',
          data: mediumFontData,
          style: 'normal',
          weight: 500,
        },
        {
          name: 'PretendardJP',
          data: boldFontData,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}

function GuideRow({
  title,
  subTitle,
  rows,
}: {
  title: string;
  subTitle: string;
  rows: Array<{ label: string; subLabel: string; value: string }>;
}) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #1f1f1f' }}>
      <div
        style={{
          width: 184,
          minWidth: 184,
          borderRight: '2px solid #1f1f1f',
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '22px 12px',
          fontSize: 26,
          fontWeight: 700,
          gap: 8,
        }}
      >
        <span>{title}</span>
        <span>{subTitle}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {rows.map((item, index) => (
          <div key={`${item.label}-${index}`} style={{ display: 'flex', borderBottom: index === rows.length - 1 ? '0' : '2px solid #1f1f1f' }}>
            <div
              style={{
                width: 156,
                minWidth: 156,
                borderRight: '2px solid #1f1f1f',
                background: '#fafafa',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '18px 10px',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {item.subLabel ? `${item.label}\n${item.subLabel}` : item.label}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '18px 20px', fontSize: 25, lineHeight: 1.5 }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuideSingleRow({
  title,
  subTitle,
  value,
}: {
  title: string;
  subTitle: string;
  value: string;
}) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #1f1f1f' }}>
      <div
        style={{
          width: 184,
          minWidth: 184,
          borderRight: '2px solid #1f1f1f',
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '22px 12px',
          fontSize: 26,
          fontWeight: 700,
          gap: 8,
        }}
      >
        <span>{title}</span>
        <span>{subTitle}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '22px 20px', fontSize: 26, lineHeight: 1.6 }}>
        {value}
      </div>
    </div>
  );
}

function GuideTextRow({
  title,
  subTitle,
  lines,
}: {
  title: string;
  subTitle: string;
  lines: string[];
}) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #1f1f1f' }}>
      <div
        style={{
          width: 184,
          minWidth: 184,
          borderRight: '2px solid #1f1f1f',
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '22px 12px',
          fontSize: 26,
          fontWeight: 700,
          gap: 8,
        }}
      >
        <span>{title}</span>
        <span>{subTitle}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, padding: '22px 20px', fontSize: 24, lineHeight: 1.7 }}>
        {lines.map((line, index) => (
          <div key={`${title}-${index}`}>{line}</div>
        ))}
      </div>
    </div>
  );
}
