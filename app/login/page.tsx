'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Plander 관리자 로그인</h1>
        <input
          type="email" placeholder="이메일" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded p-2" required
        />
        <input
          type="password" placeholder="비밀번호" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded p-2" required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-black text-white py-2 rounded hover:bg-gray-800">
          로그인
        </button>
      </form>
    </div>
  );
}