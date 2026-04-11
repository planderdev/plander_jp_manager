export function contactStatusLabel(s: string): string {
  switch (s) {
    case 'active': return '연락 가능';
    case 'inactive': return '연락 불가';
    case 'blocked': return '탈락';
    default: return s;
  }
}