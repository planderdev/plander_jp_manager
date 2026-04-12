'use client';
import { useState } from 'react';

export default function NumberInput({
  name, defaultValue = '', placeholder, className,
}: { name: string; defaultValue?: number | string | null; placeholder?: string; className?: string }) {
  const [display, setDisplay] = useState(
    defaultValue != null && defaultValue !== '' ? Number(defaultValue).toLocaleString() : ''
  );
  const raw = display.replace(/[^0-9]/g, '');

  return (
    <>
      <input type="hidden" name={name} value={raw} />
      <input type="text" value={display} placeholder={placeholder}
        inputMode="numeric"
        onChange={(e) => {
          const n = e.target.value.replace(/[^0-9]/g, '');
          setDisplay(n ? Number(n).toLocaleString() : '');
        }}
        className={className ?? 'w-full border border-gray-400 rounded p-2'} />
    </>
  );
}