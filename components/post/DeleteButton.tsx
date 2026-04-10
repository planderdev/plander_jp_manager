'use client';
import { deletePostAction } from '@/actions/posts';

export default function DeleteButton({ id }: { id: number }) {
  return (
    <form action={deletePostAction.bind(null, id)}>
      <button type="submit" className="text-red-500"
        onClick={(e) => { if (!confirm('삭제할까요?')) e.preventDefault(); }}>
        삭제
      </button>
    </form>
  );
}