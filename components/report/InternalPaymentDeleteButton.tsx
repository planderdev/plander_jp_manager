'use client';

import { deleteInternalPaymentReportAction } from '@/actions/report-links';
import { useI18n } from '@/lib/i18n/provider';
import FormActionButton from '@/components/FormActionButton';

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
