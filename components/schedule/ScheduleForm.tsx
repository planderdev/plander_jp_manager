'use client';
import { useState, useMemo } from 'react';
import { createScheduleAction } from '@/actions/schedules';

type InfOpt = { id: number; handle: string };
type CliOpt = { id: number; company_name: string };

export default function ScheduleForm({ influencers, clients }: { influencers: InfOpt[]; clients: CliOpt[] }) {
  const [query, setQuery] = useState('');
  const [selInf, setSelInf] = useState<InfOpt | null>(null);
  const [selCli, setSelCli] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('10');
  const [minute, setMinute] = useState('00');
  const [memo, setMemo] = useState('');

  const filtered = useMemo(() => {
    if (!query) return influencers.slice(0, 8);
    return influencers.filter(i => i.handle.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  }, [query, influencers]);

  const scheduledAt = date && `${date}T${hour.padStart(2,'0')}:${minute}:00`;
  const canSubmit = selInf && selCli && date;

  return (
    <form action={createScheduleAction} className="bg-white p-6 rounded-lg shadow space-y-5 max-w-2xl">
      <input type="hidden" name="scheduled_at" value={scheduledAt || ''} />
      <input type="hidden" name="influencer_id" value={selInf?.id ?? ''} />
      <input type="hidden" name="client_id" value={selCli} />

      {/* 인플루언서 검색 */}
      <div>
        <label className="text-sm block mb-1 font-medium">인플루언서 아이디 *</label>
        {selInf ? (
          <div className="flex items-center gap-2">
            <span className="px-3 py-2 bg-blue-50 border border-blue-300 rounded">@{selInf.handle}</span>
            <button type="button" onClick={() => { setSelInf(null); setSelCli(''); }}
              className="text-sm text-red-500">변경</button>
          </div>
        ) : (
          <>
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="아이디 검색..." className="w-full border border-gray-400 rounded p-2" />
            {filtered.length > 0 && (
              <div className="border border-gray-300 rounded mt-1 max-h-48 overflow-auto">
                {filtered.map((i) => (
                  <button type="button" key={i.id} onClick={() => setSelInf(i)}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100">@{i.handle}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 업체명 선택 (인플루언서 선택 후 활성) */}
      <div>
        <label className="text-sm block mb-1 font-medium">업체명 *</label>
        <select value={selCli} onChange={(e) => setSelCli(Number(e.target.value) || '')}
          disabled={!selInf}
          className="w-full border border-gray-400 rounded p-2 disabled:bg-gray-100">
          <option value="">업체 선택</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.company_name}</option>
          ))}
        </select>
      </div>

      {/* 날짜 + 시간 (30분 단위) */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm block mb-1 font-medium">날짜 *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-400 rounded p-2" />
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">시</label>
          <select value={hour} onChange={(e) => setHour(e.target.value)}
            className="w-full border border-gray-400 rounded p-2">
            {Array.from({length:24}, (_,h) => (
              <option key={h} value={String(h)}>{String(h).padStart(2,'0')}시</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">분</label>
          <select value={minute} onChange={(e) => setMinute(e.target.value)}
            className="w-full border border-gray-400 rounded p-2">
            <option value="00">00분</option>
            <option value="30">30분</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm block mb-1 font-medium">비고</label>
        <textarea name="memo" value={memo} onChange={(e) => setMemo(e.target.value)}
          rows={2} className="w-full border border-gray-400 rounded p-2" />
      </div>

      <button type="submit" disabled={!canSubmit}
        className="bg-black text-white px-6 py-2 rounded disabled:bg-gray-300">
        등록
      </button>
    </form>
  );
}