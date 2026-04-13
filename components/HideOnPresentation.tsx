'use client';
import { usePresentation } from '@/lib/presentation-context';

export default function HideOnPresentation({ children }: { children: React.ReactNode }) {
  const { presenting } = usePresentation();
  if (presenting) return null;
  return <>{children}</>;
}