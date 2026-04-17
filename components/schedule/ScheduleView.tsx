'use client';
import { useState } from 'react';
import ListView from './ListView';
import CalendarView from './CalendarView';
import type { Schedule } from '@/types/db';
import { useI18n } from '@/lib/i18n/provider';

export default function ScheduleView({ schedules }: { schedules: Schedule[] }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'list' | 'calendar'>('calendar');
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode('calendar')}
          className={`px-4 py-2 rounded ${mode==='calendar' ? 'bg-black text-white' : 'bg-white border border-gray-400'}`}>
          {t('scheduleView.calendar')}
        </button>
        <button onClick={() => setMode('list')}
          className={`px-4 py-2 rounded ${mode==='list' ? 'bg-black text-white' : 'bg-white border border-gray-400'}`}>
          {t('scheduleView.list')}
        </button>
      </div>
      {mode === 'calendar' ? <CalendarView schedules={schedules} /> : <ListView schedules={schedules} />}
    </div>
  );
}
