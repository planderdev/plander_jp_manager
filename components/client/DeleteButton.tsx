'use client';
import { deleteClientAction } from '@/actions/clients';
import { useI18n } from '@/lib/i18n/provider';
import FormActionButton from '@/components/FormActionButton';

export default function DeleteButton({ id }: { id: number }) {
  const { t } = useI18n();

  return (
    <form action={deleteClientAction.bind(null, id)}>
      <FormActionButton
        className="border border-red-500 text-red-500 px-6 py-2 rounded hover:bg-red-50"
        pendingText={t('common.loading')}
        confirmMessage={t('delete.clientConfirm')}
      >
        {t('common.delete')}
      </FormActionButton>
    </form>
  );
}
