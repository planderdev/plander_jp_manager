'use client';
import { useState } from 'react';

export default function PhoneInput({ name, defaultValue = '', required }: any) {
  const format = (v: string) => {
    const n = v.replace(/\D/g, '').slice(0, 11);
    if (n.length < 4) return n;
    if (n.length < 8) return `${n.slice(0,3)}-${n.slice(3)}`;
    return `${n.slice(0,3)}-${n.slice(3,7)}-${n.slice(7)}`;
  };
  const [val, setVal] = useState(format(defaultValue));
  return (
    <input name={name} value={val} required={required}
      onChange={(e) => setVal(format(e.target.value))}
      onCompositionEnd={(e: any) => setVal(format(e.target.value))}
      inputMode="numeric" maxLength={13}
      className="w-full border border-gray-400 rounded p-2" />
  );
}