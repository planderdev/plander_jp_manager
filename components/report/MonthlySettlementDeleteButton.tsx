'use client';

import FormActionButton from '@/components/FormActionButton';
import { deleteMonthlySettlementReportAction } from '@/actions/monthly-settlement-reports';
import { useI18n } from '@/lib/i18n/provider';

export default function MonthlySettlementDeleteButton({
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
    <form action={deleteMonthlySettlementReportAction.bind(null, id, clientIds, yearMonth)}>
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
