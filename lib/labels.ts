export function clientStatusLabel(s: string): string {
  switch (s) {
    case 'contacted': return '접촉완료';
    case 'proposed': return '제안/미팅';
    case 'negotiating': return '협상중';
    case 'active': return '진행중';
    case 'paused': return '보류';
    case 'ended': return '종료';
    default: return s;
  }
}

export function clientStatusClass(s: string): string {
  switch (s) {
    case 'contacted': return 'bg-blue-100 text-blue-800';
    case 'proposed': return 'bg-purple-100 text-purple-800';
    case 'negotiating': return 'bg-amber-100 text-amber-800';
    case 'active': return 'bg-red-100 text-red-600 font-semibold';
    case 'paused': return 'bg-yellow-100 text-yellow-800';
    case 'ended': return 'bg-gray-200 text-gray-500';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export function isInactiveClient(s: string): boolean {
  return s === 'ended';
}

// 영업 파이프라인 단계 (접촉~진행중)
export function isActivePipeline(s: string): boolean {
  return ['contacted', 'proposed', 'negotiating', 'active'].includes(s);
}

export function contactStatusLabel(s: string): string {
  switch (s) {
    case 'active': return '연락 가능';
    case 'inactive': return '연락 불가';
    case 'blocked': return '탈락';
    default: return s;
  }
}