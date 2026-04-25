'use client';

import { useFormStatus } from 'react-dom';
import { useI18n } from '@/lib/i18n/provider';

type Props = {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  confirmMessage?: string;
};

export default function FormActionButton({
  children,
  className,
  pendingText,
  confirmMessage,
}: Props) {
  const { pending } = useFormStatus();
  const { t } = useI18n();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }

        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? (pendingText ?? t('common.loading')) : children}
    </button>
  );
}

