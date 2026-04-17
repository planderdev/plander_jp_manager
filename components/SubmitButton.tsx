'use client';
import { useFormStatus } from 'react-dom';
import { useI18n } from '@/lib/i18n/provider';

export default function SubmitButton({ children, pendingText }: any) {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  const resolvedChildren = children ?? t('common.save');
  const resolvedPendingText = pendingText ?? t('common.loading');

  return (
    <button type="submit" disabled={pending}
      className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed">
      {pending ? resolvedPendingText : resolvedChildren}
    </button>
  );  
}
