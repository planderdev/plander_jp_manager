'use client';
import { useState, useMemo } from 'react';
import { createScheduleAction, updateScheduleAction } from '@/actions/schedules';
import SubmitButton from '@/components/SubmitButton';
import DeleteButton from '@/components/schedule/DeleteButton';

type InfOpt = { id: number; handle: string };
type CliOpt = { id: number; company_name: string };

export default function ScheduleForm({
  influencers, clients, schedule,
}: { influencers: InfOpt[]; clients: CliOpt[]; schedule?: any }) {
  // 수정 모드면 기존 값으로 초기화
  const initInf = schedule ? influencers.find(i => i.id === schedule.influencer_id) ?? null : null;
  const initDate = schedule ? new Date(schedule.scheduled_at) : null;
  const pad = (n: number) => String(n).padStart(2, '0');

  const [query, setQuery] = useState('');
  const [selInf, setSelInf] = useState<InfOpt | null>(initInf);
  const [selCli, setSelCli] = useState<number | ''>(schedule?.client_id ?? '');
  const [date, setDate] = useState(initDate ? `${initDate.getFullYear()}-${pad(initDate.getMonth()+1)}-${pad(initDate.getDate())}` : '');
  const [hour, setHour] = useState(initDate ? String(initDate.getHours()) : '10');
  const [minute, setMinute] = useState(initDate ? (initDate.getMinutes() >= 30 ? '30' : '00') : '00');
  const [memo, setMemo] = useState(schedule?.memo ?? '');

  const filtered = useMemo(() => {
    if (!query) return influencers.slice(0, 8);
    return influencers.filter(i => i.handle.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  }, [query, influencers]);

  const scheduledAt = date && `${date}T${hour.padStart(2,'0')}:${minute}:00+09:00`;
  const canSubmit = selInf && selCli && date;

  return (
    <form action={schedule ? updateScheduleAction : createScheduleAction}
      className="bg-white p-6 rounded-lg shadow space-y-5 max-w-2xl">
      {schedule && <input type="hidden" name="id" defaultValue={schedule.id} />}
      <input type="hidden" name="scheduled_at" value={scheduledAt || ''} />
      <input type="hidden" name="influencer_id" value={selInf?.id ?? ''} />
      <input type="hidden" name="client_id" value={selCli} />

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
            {query && filtered.length > 0 && (
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

      <SubmitButton>{schedule ? '수정' : '등록'}</SubmitButton>
      <div className="ml-auto">
  <DeleteButton id={schedule.id} />
</div>
    </form>
  );
}