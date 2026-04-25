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

function estimateInfoRowHeight(value: string) {
  const lines = countWrappedLines(value, 22);
  return Math.max(92, 34 + lines * 46);
}

function estimateSingleSectionHeight(value: string) {
  const lines = countWrappedLines(value, 26);
  return Math.max(132, 46 + lines * 48);
}

function estimateTextSectionHeight(lines: string[]) {
  const wrappedLines = lines.reduce((total, line) => total + countWrappedLines(line, 30), 0);
  return Math.max(240, 64 + wrappedLines * 48 + Math.max(0, lines.length - 1) * 18);
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
  const infoRowHeights = infoRows.map((item) => estimateInfoRowHeight(item.value));
  const infoSectionHeight = infoRowHeights.reduce((sum, height) => sum + height, 0);
  const visitHeight = estimateTextSectionHeight(sections.visit);
  const menuHeight = estimateSingleSectionHeight(brief.providedMenu);
  const publishHeight = estimateSingleSectionHeight(sections.publish);
  const postHeight = estimateSingleSectionHeight(sections.post);
  const shootHeight = estimateTextSectionHeight(sections.shoot);
  const additionalHeight = brief.additionalRequests ? estimateSingleSectionHeight(brief.additionalRequests) : 0;
  const imageHeight =
    28 * 2 +
    74 +
    infoSectionHeight +
    visitHeight +
    menuHeight +
    publishHeight +
    postHeight +
    shootHeight +
    additionalHeight +
    16;

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
            rowHeights={infoRowHeights}
            sectionHeight={infoSectionHeight}
          />
          <GuideTextRow
            title="店舗体験時のお願い"
            subTitle="매장방문 요구사항"
            lines={sections.visit}
            sectionHeight={visitHeight}
          />
          <GuideSingleRow
            title="提供メニュー"
            subTitle="제공메뉴"
            value={brief.providedMenu}
            sectionHeight={menuHeight}
          />
          <GuideSingleRow
            title="投稿時間"
            subTitle="배포시간"
            value={sections.publish}
            sectionHeight={publishHeight}
          />
          <GuideSingleRow
            title="投稿時のお願い事項"
            subTitle="게시 시 요청사항"
            value={sections.post}
            sectionHeight={postHeight}
          />
          <GuideTextRow
            title="撮影時のお願い事項"
            subTitle="촬영요청사항"
            lines={sections.shoot}
            sectionHeight={shootHeight}
          />
          {brief.additionalRequests ? (
            <GuideSingleRow
              title="追加事項"
              subTitle="추가 요청사항"
              value={brief.additionalRequests}
              sectionHeight={additionalHeight}
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
  rowHeights,
  sectionHeight,
}: {
  title: string;
  subTitle: string;
  rows: Array<{ label: string; subLabel: string; value: string }>;
  rowHeights: number[];
  sectionHeight: number;
}) {
  return (
    <div style={{ display: 'flex', height: sectionHeight, borderBottom: '2px solid #1f1f1f' }}>
      <div
        style={{
          width: 184,
          minWidth: 184,
          height: sectionHeight,
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
          <div
            key={`${item.label}-${index}`}
            style={{
              display: 'flex',
              height: rowHeights[index],
              borderBottom: index === rows.length - 1 ? '0' : '2px solid #1f1f1f',
            }}
          >
            <div
              style={{
                width: 156,
                minWidth: 156,
                height: rowHeights[index],
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
  sectionHeight,
}: {
  title: string;
  subTitle: string;
  value: string;
  sectionHeight: number;
}) {
  return (
    <div style={{ display: 'flex', height: sectionHeight, borderBottom: '2px solid #1f1f1f' }}>
      <div
        style={{
          width: 184,
          minWidth: 184,
          height: sectionHeight,
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
      <div
        style={{
          flex: 1,
          height: sectionHeight,
          display: 'flex',
          alignItems: 'center',
          padding: '22px 20px',
          fontSize: 26,
          lineHeight: 1.6,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function GuideTextRow({
  title,
  subTitle,
  lines,
  sectionHeight,
}: {
  title: string;
  subTitle: string;
  lines: string[];
  sectionHeight: number;
}) {
  return (
    <div style={{ display: 'flex', height: sectionHeight, borderBottom: '2px solid #1f1f1f' }}>
      <div
        style={{
          width: 184,
          minWidth: 184,
          height: sectionHeight,
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
      <div
        style={{
          flex: 1,
          height: sectionHeight,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          justifyContent: 'center',
          padding: '22px 20px',
          fontSize: 24,
          lineHeight: 1.7,
        }}
      >
        {lines.map((line, index) => (
          <div key={`${title}-${index}`}>{line}</div>
        ))}
      </div>
    </div>
  );
}
