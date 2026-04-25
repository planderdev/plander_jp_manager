'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  href: string;
  className?: string;
  pendingText?: string;
  children: React.ReactNode;
};

export default function BusyLinkButton({
  href,
  className,
  pendingText = '작업중...',
  children,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() => {
        if (pending) return;
        setPending(true);
        router.push(href);
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}

