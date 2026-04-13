'use client';
import { useState } from 'react';

export default function CollapsibleGroup({
  title, children, defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg shadow">
      <button type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-gray-500 text-sm">{open ? '▼' : '▶'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}