'use client';

import Link from 'next/link';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { useI18n } from '@/lib/i18n/provider';

type ExistingUpload = {
  path: string;
  name: string;
  url?: string | null;
};

type InitialTransaction = {
  id?: string;
  direction: 'incoming' | 'outgoing';
  amount: number;
  memo: string;
  happenedAt: string | null;
};

type Props = {
  selectedIds: number[];
  selectedMonth: string;
  title: string;
  selectedClientLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  mode?: 'create' | 'edit';
  cancelHref?: string;
  initialTransactions?: InitialTransaction[];
  existingBankUploads?: ExistingUpload[];
  existingTransferUploads?: ExistingUpload[];
};

type TransactionRow = {
  id: string;
  direction: 'incoming' | 'outgoing';
  amount: string;
  memo: string;
  happenedAt: string;
};

function createRowId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function emptyTransactionRow(): TransactionRow {
  return {
    id: createRowId(),
    direction: 'outgoing',
    amount: '',
    memo: '',
    happenedAt: '',
  };
}

function toTransactionRows(initialTransactions: InitialTransaction[]) {
  if (!initialTransactions.length) return [emptyTransactionRow()];
  return initialTransactions.map((item) => ({
    id: item.id || createRowId(),
    direction: item.direction,
    amount: item.amount ? String(item.amount) : '',
    memo: item.memo ?? '',
    happenedAt: item.happenedAt ?? '',
  }));
}

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
  initialExistingFiles = [],
}: {
  inputName: string;
  label: string;
  help: string;
  maxFiles?: number;
  initialExistingFiles?: ExistingUpload[];
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [existingFiles, setExistingFiles] = useState<ExistingUpload[]>(initialExistingFiles);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  const availableSlots = typeof maxFiles === 'number'
    ? Math.max(0, maxFiles - existingFiles.length)
    : undefined;

  function syncNewFiles(nextFiles: File[]) {
    const limited = typeof availableSlots === 'number' ? nextFiles.slice(0, availableSlots) : nextFiles;
    setNewFiles(limited);
    applyFilesToInput(inputRef.current, limited);
  }

  function appendFiles(incoming: File[]) {
    syncNewFiles([...newFiles, ...incoming]);
  }

  function removeNewFile(targetIndex: number) {
    syncNewFiles(newFiles.filter((_, index) => index !== targetIndex));
  }

  function removeExistingFile(targetPath: string) {
    setExistingFiles((prev) => prev.filter((item) => item.path !== targetPath));
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    appendFiles(Array.from(event.target.files ?? []));
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    appendFiles(Array.from(event.dataTransfer.files ?? []));
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
          {t('common.fileSelect')}
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
        <p className="text-sm font-medium text-gray-900">{t('monthlySettlement.dropzoneTitle')}</p>
        <p className="mt-2 text-xs text-gray-500">{t('monthlySettlement.dropzoneHelp')}</p>
      </label>

      <p className="text-xs text-gray-500">{help}</p>
      {typeof maxFiles === 'number' ? (
        <p className="text-xs text-gray-400">{t('monthlySettlement.uploadLimit', { count: maxFiles })}</p>
      ) : null}

      {existingFiles.length ? (
        <div className="rounded-2xl border border-gray-200 bg-[#fafaf8] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">{t('monthlySettlement.existingUploads')}</p>
          <ul className="mt-2 space-y-2 text-sm text-gray-700">
            {existingFiles.map((file, index) => (
              <li key={file.path} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                <div className="min-w-0 flex-1">
                  <span className="truncate">
                    {index + 1}. {file.name}
                  </span>
                  {file.url ? (
                    <a href={file.url} target="_blank" className="mt-1 block text-xs text-blue-600 hover:underline">
                      미리보기
                    </a>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeExistingFile(file.path)}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs font-semibold text-gray-500 hover:border-red-300 hover:text-red-500"
                  aria-label={`${file.name} 삭제`}
                >
                  X
                </button>
                <input type="hidden" name={`keep_${inputName}_paths`} value={file.path} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {newFiles.length ? (
        <div className="rounded-2xl border border-gray-200 bg-[#fafaf8] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">{t('monthlySettlement.newUploads')}</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            {newFiles.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3">
                <span className="truncate">
                  {index + 1}. {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeNewFile(index)}
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
  mode = 'create',
  cancelHref,
  initialTransactions = [],
  existingBankUploads = [],
  existingTransferUploads = [],
}: Props) {
  const { t } = useI18n();
  const [rows, setRows] = useState<TransactionRow[]>(() => toTransactionRows(initialTransactions));

  const serializedTransactions = JSON.stringify(
    rows
      .filter((row) => row.memo.trim() || row.amount.trim() || row.happenedAt.trim())
      .map((row) => ({
        id: row.id,
        direction: row.direction,
        amount: Number(row.amount.replace(/[^\d-]/g, '')) || 0,
        memo: row.memo.trim(),
        happenedAt: row.happenedAt.trim() || null,
      })),
  );

  function updateRow(id: string, field: keyof TransactionRow, value: string) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyTransactionRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => {
      if (prev.length === 1) return [emptyTransactionRow()];
      return prev.filter((row) => row.id !== id);
    });
  }

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
          initialExistingFiles={existingBankUploads}
        />
        <FileDropField
          inputName="transfer_proofs"
          label={t('monthlySettlement.uploadTransferProofs')}
          help={t('monthlySettlement.uploadTransferProofsHelp')}
          maxFiles={3}
          initialExistingFiles={existingTransferUploads}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="block text-sm font-medium text-gray-900">{t('monthlySettlement.manualTransactions')}</label>
          <button
            type="button"
            onClick={addRow}
            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('monthlySettlement.addRow')}
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="hidden grid-cols-[120px_180px_1fr_180px_72px] gap-0 border-b border-gray-200 bg-[#f5f6fa] px-3 py-3 text-xs font-semibold text-gray-600 md:grid">
            <div>{t('monthlySettlement.entryType')}</div>
            <div>{t('monthlySettlement.entryAmount')}</div>
            <div>{t('monthlySettlement.entryMemo')}</div>
            <div>{t('monthlySettlement.entryDate')}</div>
            <div>{t('common.remove')}</div>
          </div>

          <div className="divide-y divide-gray-200">
            {rows.map((row) => (
              <div key={row.id} className="grid gap-3 px-3 py-3 md:grid-cols-[120px_180px_1fr_180px_72px] md:items-center">
                <select
                  value={row.direction}
                  onChange={(event) => updateRow(row.id, 'direction', event.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="incoming">{t('monthlySettlement.typeIncoming')}</option>
                  <option value="outgoing">{t('monthlySettlement.typeOutgoing')}</option>
                </select>

                <input
                  value={row.amount}
                  onChange={(event) => updateRow(row.id, 'amount', event.target.value)}
                  inputMode="numeric"
                  placeholder="300000"
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />

                <input
                  value={row.memo}
                  onChange={(event) => updateRow(row.id, 'memo', event.target.value)}
                  placeholder={t('monthlySettlement.memoPlaceholder')}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />

                <input
                  value={row.happenedAt}
                  onChange={(event) => updateRow(row.id, 'happenedAt', event.target.value)}
                  placeholder="2026-04-30 15:10"
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />

                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-red-300 hover:text-red-500"
                >
                  {t('common.remove')}
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500">{t('monthlySettlement.manualTransactionsHelp')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {selectedIds.map((clientId) => (
          <input key={clientId} type="hidden" name="client_ids" value={clientId} />
        ))}
        <input type="hidden" name="year_month" value={selectedMonth} />
        <input type="hidden" name="transactions_json" value={serializedTransactions} />
        <ProgressSubmitButton mode={mode} />
        {cancelHref ? (
          <Link href={cancelHref} className="rounded border border-gray-300 px-6 py-2 text-sm text-gray-700 hover:bg-gray-50">
            {t('common.cancel')}
          </Link>
        ) : null}
      </div>
    </form>
  );
}

function ProgressSubmitButton({ mode }: { mode: 'create' | 'edit' }) {
  const { pending } = useFormStatus();
  const { t } = useI18n();

  const idleLabel = mode === 'edit' ? t('monthlySettlement.updateLink') : t('monthlySettlement.createLink');
  const pendingLabel = mode === 'edit' ? t('monthlySettlement.pendingUpdate') : t('monthlySettlement.pendingCreateSimple');

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-black px-6 py-2 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
