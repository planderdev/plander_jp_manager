'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updatePostSettlementStatusAction } from '@/actions/posts';
import { useI18n } from '@/lib/i18n/provider';

type SettlementStatus = 'pending' | 'payable' | 'done';

export default function QuickSettlementStatusForm({
  id,
  status,
  settledOn,
}: {
  id: number;
  status: SettlementStatus;
  settledOn?: string | null;
}) {
  const { t } = useI18n();
  const [currentStatus, setCurrentStatus] = useState<SettlementStatus>(status);

  return (
    <form action={updatePostSettlementStatusAction} className="flex min-w-[160px] items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="settled_on" value={settledOn ?? ''} />
      <select
        name="settlement_status"
        value={currentStatus}
        onChange={(event) => setCurrentStatus(event.target.value as SettlementStatus)}
        className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
      >
        <option value="pending">{t('postForm.pending')}</option>
        <option value="payable">{t('postForm.payable')}</option>
        <option value="done">{t('postForm.done')}</option>
      </select>
      <InlineSubmitButton />
    </form>
  );
}

function InlineSubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-black px-2.5 py-1 text-xs text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      {pending ? t('common.loading') : t('common.save')}
    </button>
  );
}
