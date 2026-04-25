'use client';
import { useI18n } from '@/lib/i18n/provider';
import FormActionButton from '@/components/FormActionButton';

export default function SubmitButton({ children, pendingText }: any) {
  const { t } = useI18n();
  const resolvedChildren = children ?? t('common.save');
  const resolvedPendingText = pendingText ?? t('common.loading');

  return (
    <FormActionButton
      pendingText={resolvedPendingText}
      className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {resolvedChildren}
    </FormActionButton>
  );  
}
