'use client';
import { useState, useTransition } from 'react';
import { addClientOption, removeClientOption, type OptionKind } from '@/actions/client-options';

type Option = { id: number; value: string };

export default function ChipSelect({
  name, label, kind, options, defaultValue = '', required,
}: {
  name: string;
  label: string;
  kind: OptionKind;
  options: Option[];
  defaultValue?: string;
  required?: boolean;
}) {
  const [selected, setSelected] = useState(defaultValue);
  const [newValue, setNewValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    const v = newValue.trim();
    if (!v) return;
    setError('');
    startTransition(async () => {
      const r = await addClientOption(kind, v);
      if (r?.error) {
        setError(r.error);
        return;
      }
      setSelected(v);
      setNewValue('');
      setShowInput(false);
    });
  }

  function handleRemove(id: number, value: string) {
    if (!confirm(`"${value}" 선택지를 삭제할까요? 기존 데이터에는 영향 없습니다.`)) return;
    startTransition(async () => {
      await removeClientOption(id);
      if (selected === value) setSelected('');
    });
  }

  return (
    <div>
      <label className="text-sm block mb-2 font-medium">{label}</label>
      <input type="hidden" name={name} value={selected} required={required} />

      <div className="flex flex-wrap gap-2 mb-2">
        {options.map((o) => (
          <div key={o.id}
            className={`flex items-center rounded-full text-sm border transition ${
              selected === o.value
                ? 'bg-black text-white border-black'
                : 'bg-white border-gray-400 hover:bg-gray-100'
            }`}>
            <button type="button"
              onClick={() => setSelected(o.value)}
              className="pl-3 pr-1 py-1">
              {o.value}
            </button>
            <button type="button"
              onClick={() => handleRemove(o.id, o.value)}
              disabled={pending}
              className={`pr-2 pl-1 py-1 text-xs ${selected === o.value ? 'opacity-80 hover:opacity-100' : 'opacity-50 hover:opacity-100'}`}
              title="선택지 삭제">
              ×
            </button>
          </div>
        ))}

        {!showInput && (
          <button type="button"
            onClick={() => setShowInput(true)}
            className="rounded-full px-3 py-1 text-sm border border-dashed border-gray-500 hover:bg-gray-50">
            + 추가
          </button>
        )}
      </div>

      {showInput && (
        <div className="flex gap-2 items-start">
          <input type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
              if (e.key === 'Escape') { setShowInput(false); setNewValue(''); setError(''); }
            }}
            autoFocus
            placeholder="새 항목 입력 후 엔터"
            disabled={pending}
            className="border border-gray-400 rounded p-2 text-sm flex-1" />
          <button type="button" onClick={handleAdd} disabled={pending}
            className="bg-black text-white px-3 py-2 rounded text-sm disabled:bg-gray-400">
            저장
          </button>
          <button type="button"
            onClick={() => { setShowInput(false); setNewValue(''); setError(''); }}
            className="border border-gray-400 px-3 py-2 rounded text-sm">
            취소
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}