import { createClient } from '@/lib/supabase/server';
import { generateReportAction } from '@/actions/reports';
import DownloadButton from '@/components/report/DownloadButton';
import DeleteButton from '@/components/report/DeleteButton';

export default async function ReportsPage() {
  const sb = await createClient();
  const [{ data: clients }, { data: reports }] = await Promise.all([
    sb.from('clients').select('id, company_name').order('company_name'),
    sb.from('reports').select('*, clients(company_name)').order('created_at', { ascending: false }),
  ]);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold">보고서 생성/관리</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">신규 생성</h2>
        <form action={generateReportAction} className="bg-white p-6 rounded-lg shadow flex flex-wrap gap-4 items-end max-w-2xl">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm block mb-1 font-medium">업체 *</label>
            <select name="client_id" required className="w-full border border-gray-400 rounded p-2">
              <option value="">선택</option>
              {clients?.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">월 *</label>
            <input type="month" name="year_month" required className="border border-gray-400 rounded p-2" />
          </div>
          <button type="submit" className="bg-black text-white px-6 py-2 rounded">생성</button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">생성된 보고서</h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">업체명</th>
                <th className="p-3">월</th>
                <th className="p-3">파일명</th>
                <th className="p-3">생성일</th>
                <th className="p-3">관리</th>
              </tr>
            </thead>
            <tbody>
              {reports?.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.clients?.company_name}</td>
                  <td className="p-3">{r.year_month}</td>
                  <td className="p-3">{r.file_name}</td>
                  <td className="p-3">{new Date(r.created_at).toLocaleDateString('ko-KR')}</td>
                  <td className="p-3 space-x-3">
                    <DownloadButton filePath={r.file_path} />
                    <DeleteButton id={r.id} />
                  </td>
                </tr>
              ))}
              {!reports?.length && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">생성된 보고서가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}