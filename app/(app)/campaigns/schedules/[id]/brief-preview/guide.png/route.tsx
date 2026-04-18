import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { getBriefScheduleData, getGuideSections } from '@/lib/briefing';

export const runtime = 'nodejs';

function row(label: string, subLabel: string, value: string) {
  return { label, subLabel, value };
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

  const sections = getGuideSections();
  const home = process.env.HOME ?? '/Users/insung';
  const regularFontPath = path.join(home, 'Library', 'Fonts', 'PretendardJP-Regular.otf');
  const mediumFontPath = path.join(home, 'Library', 'Fonts', 'PretendardJP-Medium.otf');
  const boldFontPath = path.join(home, 'Library', 'Fonts', 'PretendardJP-Bold.otf');
  const [regularFontData, mediumFontData, boldFontData] = await Promise.all([
    readFile(regularFontPath),
    readFile(mediumFontPath),
    readFile(boldFontPath),
  ]);

  const infoRows = [
    row('店舗情報', '매장정보', brief.storeNameJa),
    row('住所', '', brief.addressJa),
    row('韓国語の住所', '', brief.addressKo),
    row('営業時間', '', brief.businessHours),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '1240px',
          minHeight: '1754px',
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
      width: 1240,
      height: brief.additionalRequests ? 1960 : 1754,
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
