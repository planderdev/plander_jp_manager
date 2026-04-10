import DeleteButton from './DeleteButton';
import Link from 'next/link';
import { deleteScheduleAction } from '@/actions/schedules';
import type { Schedule } from '@/types/db';

export default function ListView({ schedules }: { schedules: Schedule[] }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">일시</th>
            <th className="p-3">업체명</th>
            <th className="p-3">인플루언서 아이디</th>
            <th className="p-3">계정링크</th>
            <th className="p-3">관리</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s) => {
            const d = new Date(s.scheduled_at);
            const dateStr = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            return (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-medium">{dateStr}</td>
                <td className="p-3">{s.clients?.company_name ?? '-'}</td>
                <td className="p-3">@{s.influencers?.handle}</td>
                <td className="p-3">
                  {s.influencers?.account_url && (
                    <a href={s.influencers.account_url} target="_blank" className="text-blue-600 hover:underline">
                      링크
                    </a>
                  )}
                </td>
                <td className="p-3">
                  <DeleteButton id={s.id} />
                </td>
              </tr>
            );
          })}
          {!schedules.length && (
            <tr><td colSpan={5} className="p-8 text-center text-gray-400">스케줄이 없습니다</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}