import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Plander',
    short_name: 'Plander',
    description: '플랜더는 이름 그대로 신규브랜드 및 기존브랜드 에 필요한 브랜딩/리브랜딩의 모든 일을 할수 있는 능력이 있는 회사입니다.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#111111',
    theme_color: '#111111',
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
