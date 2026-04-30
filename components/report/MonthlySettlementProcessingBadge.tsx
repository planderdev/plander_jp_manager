'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  reportId: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string | null;
};

function badgeClass(status: Props['status']) {
  switch (status) {
    case 'done':
      return 'bg-emerald-100 text-emerald-700';
    case 'error':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
}

function badgeLabel(status: Props['status']) {
  switch (status) {
    case 'done':
      return '분석 완료';
    case 'error':
      return '분석 오류';
    case 'processing':
      return '분석중';
    default:
      return '대기중';
  }
}

export default function MonthlySettlementProcessingBadge({ reportId, status, error }: Props) {
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (status !== 'pending' || startedRef.current) return;
    startedRef.current = true;

    fetch('/api/monthly-settlement/process', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reportId }),
    })
      .catch(() => null)
      .finally(() => {
        router.refresh();
      });
  }, [reportId, router, status]);

  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(status)}`}>
        {badgeLabel(status)}
      </span>
      {status === 'error' && error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : null}
    </div>
  );
}
