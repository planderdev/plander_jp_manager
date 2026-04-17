'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/provider';
import { localeLabels } from '@/lib/i18n/config';

const REMEMBERED_EMAIL_KEY = 'plander-remembered-email';

export default function LoginPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.localStorage.getItem(REMEMBERED_EMAIL_KEY));
  });
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setIsSubmitting(false);
      return;
    }
    if (rememberEmail) window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    else window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    router.push('/dashboard');
  }

  function handleEnterSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
    e.preventDefault();
    formRef.current?.requestSubmit();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex justify-end">
          <div className="rounded-full border border-gray-300 bg-white p-1 shadow-sm">
            {(['ko', 'ja'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setLocale(value)}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  locale === value ? 'bg-black text-white' : 'text-gray-700'
                }`}
              >
                {localeLabels[value]}
              </button>
            ))}
          </div>
        </div>
        <form ref={formRef} onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">{t('login.title')}</h1>
        <input
          type="email" name="email" placeholder={t('login.email')} value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleEnterSubmit}
          autoComplete="email"
          className="w-full border rounded p-2" required
        />
        <input
          type="password" name="password" placeholder={t('login.password')} value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleEnterSubmit}
          autoComplete="current-password"
          className="w-full border rounded p-2" required
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={rememberEmail}
            onChange={(e) => setRememberEmail(e.target.checked)}
          />
          <span>{t('login.rememberEmail')}</span>
        </label>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-500"
        >
          {t('login.submit')}
        </button>
        </form>
      </div>
    </div>
  );
}
