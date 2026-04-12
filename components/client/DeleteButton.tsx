'use client';
import { deleteClientAction } from '@/actions/clients';

export default function DeleteButton({ id }: { id: number }) {
  return (
    <form action={deleteClientAction.bind(null, id)}>
      <button type="submit"
        className="border border-red-500 text-red-500 px-6 py-2 rounded hover:bg-red-50"
        onClick={(e) => { if (!confirm('정말 삭제할까요?')) e.preventDefault(); }}>
        삭제
      </button>
    </form>
  );
}