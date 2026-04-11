const TZ = 'Asia/Seoul';

// "지금" 을 한국시간 기준 컴포넌트(년/월/일/시/분)로 반환
function partsInTZ(date: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const obj: any = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== 'literal') obj[p.type] = p.value;
  }
  return {
    year: Number(obj.year),
    month: Number(obj.month),
    day: Number(obj.day),
    hour: Number(obj.hour === '24' ? '0' : obj.hour),
    minute: Number(obj.minute),
  };
}

// 한국시간 기준 'YYYY-MM-DD' 키
export function ymdKR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const p = partsInTZ(d);
  return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`;
}

// 한국시간 기준 'M/D HH:mm'
export function shortKR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const p = partsInTZ(d);
  return `${p.month}/${p.day} ${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')}`;
}

// 한국시간 기준 'YYYY/M/D HH:mm'
export function fullKR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const p = partsInTZ(d);
  return `${p.year}/${p.month}/${p.day} ${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')}`;
}

// 한국시간 기준 'HH:mm'
export function timeKR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const p = partsInTZ(d);
  return `${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')}`;
}

// 두 날짜를 한국시간 기준 날짜만 비교 (같은 날이면 0, a가 과거면 음수)
export function compareDayKR(a: Date | string, b: Date | string): number {
  return ymdKR(a).localeCompare(ymdKR(b));
}

// 한국시간 기준 "오늘"의 yyyy-mm-dd
export function todayKR(): string {
  return ymdKR(new Date());
}