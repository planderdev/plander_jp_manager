'use client';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/provider';

export default function BackButton() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <button type="button" onClick={() => router.back()}
      className="border border-gray-400 px-6 py-2 rounded hover:bg-gray-100">
      {t('common.back')}
    </button>
  );
}
