import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { getBriefScheduleData, formatInviteDate } from '@/lib/briefing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  const regularFontPath = path.join(process.cwd(), 'public', 'fonts', 'PretendardJP-Regular.otf');
  const mediumFontPath = path.join(process.cwd(), 'public', 'fonts', 'PretendardJP-Medium.otf');
  const boldFontPath = path.join(process.cwd(), 'public', 'fonts', 'PretendardJP-Bold.otf');
  const [regularFontData, mediumFontData, boldFontData] = await Promise.all([
    readFile(regularFontPath),
    readFile(mediumFontPath),
    readFile(boldFontPath),
  ]);
  const templatePath = path.join(process.cwd(), 'public', 'templates', 'invitation-template.jpg');
  const templateData = await readFile(templatePath);
  const templateDataUrl = `data:image/jpeg;base64,${templateData.toString('base64')}`;

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
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
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
