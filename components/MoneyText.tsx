'use client';
import { usePresentation } from '@/lib/presentation-context';
import { useI18n } from '@/lib/i18n/provider';

export default function MoneyText({
  value, suffix, placeholder,
}: { value: number | null | undefined; suffix?: string; placeholder?: string }) {
  const { presenting } = usePresentation();
  const { t } = useI18n();
  const resolvedSuffix = suffix ?? t('money.won');
  const resolvedPlaceholder = placeholder ?? t('money.placeholder');

  if (presenting) return <span>{resolvedPlaceholder}</span>;
  if (value == null) return <span>-</span>;
  return <span>{value.toLocaleString()}{resolvedSuffix}</span>;
}
