'use client';
import { deleteReportAction } from '@/actions/reports';
import { useI18n } from '@/lib/i18n/provider';

export default function DeleteButton({ id }: { id: number }) {
  const { t } = useI18n();

  return (
    <form action={deleteReportAction.bind(null, id)}>
      <button type="submit" className="text-red-500"
        onClick={(e) => { if (!confirm(t('delete.confirm'))) e.preventDefault(); }}>{t('common.delete')}</button>
    </form>
  );
}
