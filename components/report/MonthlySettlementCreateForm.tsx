'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { useI18n } from '@/lib/i18n/provider';

type Props = {
  selectedIds: number[];
  selectedMonth: string;
  title: string;
  selectedClientLabel: string;
  action: (formData: FormData) => void | Promise<void>;
};

function applyFilesToInput(input: HTMLInputElement | null, files: File[]) {
  if (!input) return;
  const transfer = new DataTransfer();
  files.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
}

function FileDropField({
  inputName,
  label,
  help,
  maxFiles,
}: {
  inputName: string;
  label: string;
  help: string;
  maxFiles?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  function syncFiles(nextFiles: File[]) {
    const limited = typeof maxFiles === 'number' ? nextFiles.slice(0, maxFiles) : nextFiles;
    setFiles(limited);
    applyFilesToInput(inputRef.current, limited);
  }

  function removeFile(targetIndex: number) {
    syncFiles(files.filter((_, index) => index !== targetIndex));
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    syncFiles(Array.from(event.target.files ?? []));
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    syncFiles(Array.from(event.dataTransfer.files ?? []));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-gray-900">{label}</label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          파일 선택
        </button>
      </div>

      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`block rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragging ? 'border-black bg-gray-50' : 'border-gray-300 bg-white'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          name={inputName}
          accept="image/png,image/jpeg,image/webp"
          multiple={maxFiles !== 1}
          onChange={handleInputChange}
          className="hidden"
        />
        <p className="text-sm font-medium text-gray-900">여기에 사진을 끌어다 놓으세요</p>
        <p className="mt-2 text-xs text-gray-500">또는 위의 파일 선택 버튼으로 올릴 수 있습니다.</p>
      </label>

      <p className="text-xs text-gray-500">{help}</p>

      {files.length ? (
        <div className="rounded-2xl border border-gray-200 bg-[#fafaf8] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Selected</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3">
                <span className="truncate">
                  {index + 1}. {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs font-semibold text-gray-500 hover:border-red-300 hover:text-red-500"
                  aria-label={`${file.name} 삭제`}
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function MonthlySettlementCreateForm({
  selectedIds,
  selectedMonth,
  title,
  selectedClientLabel,
  action,
}: Props) {
  const { t } = useI18n();

  return (
    <form action={action} className="grid gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{selectedClientLabel || '-'}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <FileDropField
          inputName="bank_screenshots"
          label={t('monthlySettlement.uploadScreenshots')}
          help={t('monthlySettlement.uploadHelp')}
          maxFiles={3}
        />
        <FileDropField
          inputName="transfer_proofs"
          label={t('monthlySettlement.uploadTransferProofs')}
          help={t('monthlySettlement.uploadTransferProofsHelp')}
          maxFiles={3}
        />
      </div>

      <div className="flex items-center gap-3">
        {selectedIds.map((clientId) => (
          <input key={clientId} type="hidden" name="client_ids" value={clientId} />
        ))}
        <input type="hidden" name="year_month" value={selectedMonth} />
        <ProgressSubmitButton />
      </div>
    </form>
  );
}

function ProgressSubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-black px-6 py-2 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      {pending ? t('monthlySettlement.pendingCreateSimple') : t('monthlySettlement.createLink')}
    </button>
  );
}
