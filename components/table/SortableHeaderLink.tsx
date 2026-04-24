import Link from 'next/link';
import type { SortOrder } from '@/lib/table-sort';

type SearchParamsValue = string | string[] | undefined;

function appendParams(params: URLSearchParams, key: string, value: SearchParamsValue) {
  if (Array.isArray(value)) {
    value.forEach((entry) => params.append(key, entry));
    return;
  }

  if (value != null && value !== '') {
    params.set(key, value);
  }
}

export default function SortableHeaderLink({
  label,
  sortKey,
  currentSort,
  currentOrder,
  searchParams,
  className = '',
  sortParamName = 'sort',
  orderParamName = 'order',
}: {
  label: string;
  sortKey: string;
  currentSort?: string;
  currentOrder?: SortOrder;
  searchParams?: Record<string, SearchParamsValue>;
  className?: string;
  sortParamName?: string;
  orderParamName?: string;
}) {
  const params = new URLSearchParams();

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (key === sortParamName || key === orderParamName) return;
    appendParams(params, key, value);
  });

  const nextOrder: SortOrder =
    currentSort === sortKey && currentOrder === 'asc' ? 'desc' : 'asc';

  params.set(sortParamName, sortKey);
  params.set(orderParamName, nextOrder);

  const isActive = currentSort === sortKey;
  const direction = !isActive ? '' : currentOrder === 'asc' ? ' ^' : ' v';

  return (
    <Link
      href={`?${params.toString()}`}
      className={`inline-flex items-center gap-1 hover:text-black ${isActive ? 'font-semibold text-black' : ''} ${className}`}
    >
      <span>{label}</span>
      <span className="text-xs text-gray-400">{direction}</span>
    </Link>
  );
}
