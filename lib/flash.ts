import { cookies } from 'next/headers';

export const FLASH_COOKIE_NAME = 'plander_flash';

export type FlashMessage = {
  id: string;
  title: string;
  body: string;
};

function safeParseFlash(raw: string | undefined) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<FlashMessage>;
    if (!parsed?.title || !parsed?.body) return null;

    return {
      id: parsed.id || `${Date.now()}`,
      title: parsed.title,
      body: parsed.body,
    } satisfies FlashMessage;
  } catch {
    return null;
  }
}

export async function readFlashMessage() {
  const cookieStore = await cookies();
  return safeParseFlash(cookieStore.get(FLASH_COOKIE_NAME)?.value);
}

export async function setFlashMessage(input: Omit<FlashMessage, 'id'> & { id?: string }) {
  const cookieStore = await cookies();
  const message: FlashMessage = {
    id: input.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: input.title,
    body: input.body,
  };

  cookieStore.set(FLASH_COOKIE_NAME, JSON.stringify(message), {
    path: '/',
    sameSite: 'lax',
    maxAge: 60,
  });
}

