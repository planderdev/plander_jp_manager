'use client';
import { deleteClientAction } from '@/actions/clients';
import { useI18n } from '@/lib/i18n/provider';

export default function DeleteButton({ id }: { id: number }) {
  const { t } = useI18n();

  return (
    <form action={deleteClientAction.bind(null, id)}>
      <button type="submit"
        className="border border-red-500 text-red-500 px-6 py-2 rounded hover:bg-red-50"
        onClick={(e) => { if (!confirm(t('delete.clientConfirm'))) e.preventDefault(); }}>
        {t('common.delete')}
      </button>
    </form>
  );
}
