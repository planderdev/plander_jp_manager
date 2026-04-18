import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { getBriefScheduleData, formatInviteDate } from '@/lib/briefing';

export const runtime = 'nodejs';

function valueMaskStyle(top: number, width: number, height = 72) {
  return {
    position: 'absolute' as const,
    top,
    left: '50%',
    transform: 'translateX(-50%)',
    width,
    height,
    background: '#10080d',
  };
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

  const home = process.env.HOME ?? '/Users/insung';
  const regularFontPath = path.join(home, 'Library', 'Fonts', 'PretendardJP-Regular.otf');
  const mediumFontPath = path.join(home, 'Library', 'Fonts', 'PretendardJP-Medium.otf');
  const boldFontPath = path.join(home, 'Library', 'Fonts', 'PretendardJP-Bold.otf');
  const [regularFontData, mediumFontData, boldFontData] = await Promise.all([
    readFile(regularFontPath),
    readFile(mediumFontPath),
    readFile(boldFontPath),
  ]);
  const templatePath = path.join(process.cwd(), 'public', 'templates', 'invitation-template.jpg');
  const templateData = await readFile(templatePath);
  const templateDataUrl = `data:image/jpeg;base64,${templateData.toString('base64')}`;
  const flagSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="24" viewBox="0 0 68 48">
      <rect width="68" height="48" rx="3" fill="#ffffff"/>
      <g transform="translate(34 24)">
        <path d="M0 -9a9 9 0 0 1 0 18a9 9 0 0 1 0 -18z" fill="#cd2e3a"/>
        <path d="M0 9a9 9 0 0 0 0 -18a9 9 0 0 0 0 18z" fill="#0047a0"/>
        <circle cx="0" cy="-4.5" r="4.5" fill="#0047a0"/>
        <circle cx="0" cy="4.5" r="4.5" fill="#cd2e3a"/>
      </g>
      <g fill="#111111">
        <rect x="9" y="10" width="11" height="2.2" rx="1.1" transform="rotate(-35 14.5 11.1)"/>
        <rect x="10" y="14" width="11" height="2.2" rx="1.1" transform="rotate(-35 15.5 15.1)"/>
        <rect x="11" y="18" width="11" height="2.2" rx="1.1" transform="rotate(-35 16.5 19.1)"/>
        <rect x="48" y="28" width="11" height="2.2" rx="1.1" transform="rotate(-35 53.5 29.1)"/>
        <rect x="47" y="32" width="11" height="2.2" rx="1.1" transform="rotate(-35 52.5 33.1)"/>
        <rect x="46" y="36" width="11" height="2.2" rx="1.1" transform="rotate(-35 51.5 37.1)"/>
        <rect x="48" y="10" width="11" height="2.2" rx="1.1" transform="rotate(35 53.5 11.1)"/>
        <rect x="47" y="14" width="11" height="2.2" rx="1.1" transform="rotate(35 52.5 15.1)"/>
        <rect x="46" y="18" width="11" height="2.2" rx="1.1" transform="rotate(35 51.5 19.1)"/>
        <rect x="10" y="28" width="11" height="2.2" rx="1.1" transform="rotate(35 15.5 29.1)"/>
        <rect x="9" y="32" width="11" height="2.2" rx="1.1" transform="rotate(35 14.5 33.1)"/>
        <rect x="8" y="36" width="11" height="2.2" rx="1.1" transform="rotate(35 13.5 37.1)"/>
      </g>
    </svg>
  `.trim();
  const flagDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(flagSvg)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'PretendardJP',
          background: '#12090f',
        }}
      >
        <img
          src={templateDataUrl}
          alt=""
          width={1080}
          height={1920}
          style={{
            position: 'absolute',
            inset: 0,
            objectFit: 'cover',
          }}
        />

        <div style={valueMaskStyle(792, 620, 78)} />
        <div style={valueMaskStyle(868, 720, 78)} />
        <div style={valueMaskStyle(996, 500, 92)} />
        <div style={valueMaskStyle(1152, 560, 96)} />

        <img
          src={flagDataUrl}
          alt=""
          width={34}
          height={24}
          style={{
            position: 'absolute',
            top: 645,
            left: 904,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 794,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 725,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 400, lineHeight: 1.73, letterSpacing: -0.72 }}>
            {brief.clientName}
          </div>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 400, lineHeight: 1.73, letterSpacing: -0.72 }}>
            {brief.storeNameJa}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 996,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 725,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 400, lineHeight: 1.73, letterSpacing: -0.72 }}>
            {brief.influencerHandle}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 1152,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 725,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 400, lineHeight: 1.73, letterSpacing: -0.72 }}>
            {formatInviteDate(brief.scheduledAt)}
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
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
