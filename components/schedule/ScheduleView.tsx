'use client';
import { useState } from 'react';
import ListView from './ListView';
import CalendarView from './CalendarView';
import type { Schedule } from '@/types/db';

export default function ScheduleView({ schedules }: { schedules: Schedule[] }) {
  const [mode, setMode] = useState<'list' | 'calendar'>('list');
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode('list')}
          className={`px-4 py-2 rounded ${mode==='list' ? 'bg-black text-white' : 'bg-white border border-gray-400'}`}>
          리스트
        </button>
        <button onClick={() => setMode('calendar')}
          className={`px-4 py-2 rounded ${mode==='calendar' ? 'bg-black text-white' : 'bg-white border border-gray-400'}`}>
          달력
        </button>
      </div>
      {mode === 'list' ? <ListView schedules={schedules} /> : <CalendarView schedules={schedules} />}
    </div>
  );
}