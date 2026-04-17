'use client';
import { useFormStatus } from 'react-dom';

export default function SubmitButton({ children = '저장', pendingText = '작업중입니다...' }: any) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed">
      {pending ? pendingText : children}
    </button>
  );  
}
