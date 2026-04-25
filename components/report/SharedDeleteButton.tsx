'use client';

import { deleteSharedReportAction } from '@/actions/report-links';
import { useI18n } from '@/lib/i18n/provider';
import FormActionButton from '@/components/FormActionButton';

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
      <FormActionButton
        className="text-red-500 hover:underline"
        pendingText={t('common.loading')}
        confirmMessage={t('delete.confirm')}
      >
        {t('common.delete')}
      </FormActionButton>
    </form>
  );
}
