import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { getBriefScheduleData, formatInviteDate } from '@/lib/briefing';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const brief = await getBriefScheduleData(Number(id));

  if (!brief) {
    return new Response('Not found', { status: 404 });
  }

  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansKR-Regular.ttf');
  const fontData = await readFile(fontPath);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1080px',
          height: '1920px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(circle at 50% 18%, rgba(179,214,255,0.28), transparent 18%), radial-gradient(circle at 50% 84%, rgba(255,184,215,0.2), transparent 24%), linear-gradient(180deg, #12090f 0%, #160d14 54%, #0f0a0f 100%)',
          color: '#f8f3f6',
          fontFamily: 'NotoSansKR',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 24,
            border: '2px solid rgba(220,190,255,0.45)',
            borderRadius: 24,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 52,
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 16,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 72,
            left: 110,
            right: 110,
            height: 260,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 620,
              height: 180,
              borderTop: '10px solid rgba(177,224,255,0.8)',
              borderLeft: '10px solid rgba(177,224,255,0.35)',
              borderRight: '10px solid rgba(255,198,227,0.35)',
              borderBottom: '14px solid rgba(255,255,255,0.14)',
              borderRadius: 999,
              opacity: 0.75,
              transform: 'perspective(500px) rotateX(62deg)',
            }}
          />
        </div>

        <div
          style={{
            marginTop: 350,
            padding: '0 120px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 18,
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 700 }}>こんにちは！</div>
          <div style={{ fontSize: 44, lineHeight: 1.5 }}>韓国最大の都市ソウルへようこそ！</div>

          <div style={{ marginTop: 42, fontSize: 34, opacity: 0.9 }}>店名 (상호)</div>
          <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.3 }}>{brief.storeNameJa}</div>
          <div style={{ fontSize: 40, opacity: 0.82 }}>{brief.clientName}</div>

          <div style={{ marginTop: 34, fontSize: 34, opacity: 0.9 }}>Instagram ID</div>
          <div style={{ fontSize: 58, fontWeight: 700 }}>@{brief.influencerHandle}</div>

          <div style={{ marginTop: 34, fontSize: 34, opacity: 0.9 }}>来店日 (방문일)</div>
          <div style={{ fontSize: 54, fontWeight: 700 }}>{formatInviteDate(brief.scheduledAt)}</div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 70,
            left: 80,
            right: 80,
            height: 460,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: 18,
            opacity: 0.95,
          }}
        >
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              style={{
                width: 110 + (index % 2) * 14,
                height: 190 + (index % 3) * 40,
                borderRadius: '55% 55% 48% 48%',
                background: index % 2 === 0 ? 'rgba(186,223,255,0.82)' : 'rgba(255,192,225,0.76)',
                boxShadow: '0 0 18px rgba(255,255,255,0.18)',
                transform: `rotate(${index % 2 === 0 ? -8 : 8}deg)`,
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: [
        {
          name: 'NotoSansKR',
          data: fontData,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}
