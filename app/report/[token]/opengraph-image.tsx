import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Plander';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

const SHARE_DESCRIPTION = '플랜더는 이름 그대로 신규브랜드 및 기존브랜드 에 필요한 브랜딩/리브랜딩의 모든 일을 할수 있는 능력이 있는 회사입니다.';

export default async function OpenGraphImage() {
  const logoPath = path.join(process.cwd(), 'public', 'logo.svg');
  const logoSvg = await readFile(logoPath, 'utf8');
  const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#000000',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top left, rgba(255,255,255,0.16), transparent 32%), radial-gradient(circle at bottom right, rgba(255,255,255,0.08), transparent 28%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            padding: '68px 76px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <img
              src={logoDataUrl}
              alt="Plander"
              width={360}
              height={66}
              style={{ objectFit: 'contain' }}
            />
            <div
              style={{
                border: '1px solid rgba(255,255,255,0.24)',
                borderRadius: 9999,
                padding: '12px 22px',
                fontSize: 24,
                letterSpacing: '0.18em',
              }}
            >
              PLANDER
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              maxWidth: 900,
            }}
          >
            <div
              style={{
                fontSize: 68,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
              }}
            >
              Plander
            </div>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.82)',
              }}
            >
              {SHARE_DESCRIPTION}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
