'use client';
import { deleteReportAction } from '@/actions/reports';

export default function DeleteButton({ id }: { id: number }) {
  return (
    <form action={deleteReportAction.bind(null, id)}>
      <button type="submit" className="text-red-500"
        onClick={(e) => { if (!confirm('삭제할까요?')) e.preventDefault(); }}>삭제</button>
    </form>
  );
}