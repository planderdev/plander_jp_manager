'use client';
import { useState } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths } from 'date-fns';
import type { Schedule } from '@/types/db';

export default function CalendarView({ schedules }: { schedules: Schedule[] }) {
  const [cursor, setCursor] = useState(new Date());

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });

  const byDay = new Map<string, Schedule[]>();
  for (const s of schedules) {
    const key = format(new Date(s.scheduled_at), 'yyyy-MM-dd');
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(s);
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCursor(addMonths(cursor, -1))} className="px-3 py-1 border border-gray-400 rounded">◀</button>
        <h2 className="text-lg font-bold">{format(cursor, 'yyyy년 M월')}</h2>
        <button onClick={() => setCursor(addMonths(cursor, 1))} className="px-3 py-1 border border-gray-400 rounded">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-300">
        {['일','월','화','수','목','금','토'].map((d) => (
          <div key={d} className="bg-gray-100 p-2 text-center text-xs font-semibold">{d}</div>
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const items = byDay.get(key) ?? [];
          const dim = !isSameMonth(day, cursor);
          const today = isSameDay(day, new Date());
          return (
            <div key={key} className={`bg-white p-1 min-h-[96px] ${dim ? 'opacity-40' : ''}`}>
              <div className={`text-xs ${today ? 'font-bold text-blue-600' : ''}`}>{format(day, 'd')}</div>
              <div className="space-y-0.5 mt-1">
                {items.map((s) => {
                  const d = new Date(s.scheduled_at);
                  const hm = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                  return (
                    <div key={s.id} className="text-[10px] bg-blue-100 rounded px-1 truncate">
                      {hm} @{s.influencers?.handle} · {s.clients?.company_name}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}