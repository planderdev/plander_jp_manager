'use client';

import { deleteSharedReportAction } from '@/actions/report-links';
import { useI18n } from '@/lib/i18n/provider';

export default function SharedDeleteButton({
  id,
  clientIds,
  yearMonth,
}: {
  id: number;
  clientIds: number[];
  yearMonth: string;
}) {
  const { t } = useI18n();

  return (
    <form action={deleteSharedReportAction.bind(null, id, clientIds, yearMonth)}>
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
