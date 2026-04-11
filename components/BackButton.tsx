'use client';
import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.back()}
      className="border border-gray-400 px-6 py-2 rounded hover:bg-gray-100">
      뒤로
    </button>
  );
}