'use client';
import { deleteScheduleAction } from '@/actions/schedules';
import { useI18n } from '@/lib/i18n/provider';
import FormActionButton from '@/components/FormActionButton';

export default function DeleteButton({ id }: { id: number }) {
  const { t } = useI18n();

  return (
    <form action={deleteScheduleAction.bind(null, id)}>
      <FormActionButton className="text-red-500" pendingText={t('common.loading')} confirmMessage={t('delete.confirm')}>
        {t('common.delete')}
      </FormActionButton>
    </form>
  );
}
