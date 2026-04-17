import { cookies } from 'next/headers';
import { LOCALE_COOKIE, type Locale, translate } from '@/lib/i18n/config';

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value === 'ja' ? 'ja' : 'ko';
}

export async function getI18n() {
  const locale = await getLocale();
  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
  };
}
