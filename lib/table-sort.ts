export type SortOrder = 'asc' | 'desc';

function normalizeSortValue(value: unknown): number | string {
  if (value == null) return '';
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  if (typeof value === 'boolean') return value ? 1 : 0;

  const text = String(value).trim();
  const numeric = Number(text.replaceAll(',', ''));
  if (text !== '' && !Number.isNaN(numeric) && /^-?[\d,.]+$/.test(text)) {
    return numeric;
  }

  return text.toLowerCase();
}

export function compareSortValues(left: unknown, right: unknown, order: SortOrder = 'asc') {
  const a = normalizeSortValue(left);
  const b = normalizeSortValue(right);

  let result = 0;
  if (typeof a === 'number' && typeof b === 'number') {
    result = a - b;
  } else {
    result = String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  }

  return order === 'asc' ? result : -result;
}

export function sortItems<T>(
  items: T[],
  getValue: (item: T) => unknown,
  order: SortOrder = 'asc'
) {
  return [...items].sort((left, right) => compareSortValues(getValue(left), getValue(right), order));
}
