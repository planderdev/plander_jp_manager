'use client';

import { deleteInternalPaymentReportAction } from '@/actions/report-links';
import { useI18n } from '@/lib/i18n/provider';

export default function InternalPaymentDeleteButton({
  id,
  clientId,
  influencerId,
  fromDate,
  toDate,
}: {
  id: number;
  clientId?: number | null;
  influencerId?: number | null;
  fromDate?: string | null;
  toDate?: string | null;
}) {
  const { t } = useI18n();

  return (
    <form action={deleteInternalPaymentReportAction.bind(null, id, { clientId, influencerId, fromDate, toDate })}>
      <button
        type="submit"
        className="text-red-500 hover:underline"
        onClick={(event) => {
          if (!confirm(t('delete.confirm'))) event.preventDefault();
        }}
      >
        {t('common.delete')}
      </button>
    </form>
  );
}
