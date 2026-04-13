'use client';
import { usePresentation } from '@/lib/presentation-context';

export default function MoneyText({
  value, suffix = '원', placeholder = '***',
}: { value: number | null | undefined; suffix?: string; placeholder?: string }) {
  const { presenting } = usePresentation();
  if (presenting) return <span>{placeholder}</span>;
  if (value == null) return <span>-</span>;
  return <span>{value.toLocaleString()}{suffix}</span>;
}