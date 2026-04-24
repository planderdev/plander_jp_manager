import ChannelIcon from '@/components/ChannelIcon';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import SortableHeaderLink from '@/components/table/SortableHeaderLink';
import { channelLabel } from '@/lib/labels';
import { getI18n } from '@/lib/i18n/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sortItems, type SortOrder } from '@/lib/table-sort';
import type {
  ChannelType,
  InfluencerApplication,
  InfluencerApplicationStatus,
} from '@/types/db';

function normalizePlatform(value: string): ChannelType {
  const platform = value.trim().toLowerCase();

  if (platform.includes('insta')) return 'instagram';
  if (platform.includes('tik')) return 'tiktok';
  if (platform.includes('you')) return 'youtube';

  return 'other';
}

function normalizeHandle(value: string) {
  const raw = value.trim();

  if (!raw.startsWith('http://') && !raw.startsWith('https://') && !raw.includes('/')) {
    return raw.replace(/^@/, '');
  }

  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const parts = url.pathname.split('/').filter(Boolean);
    return (parts.at(-1) ?? raw).replace(/^@/, '');
  } catch {
    return raw.replace(/^@/, '');
  }
}

function buildAccountUrl(platform: ChannelType, handle: string) {
  if (!handle) return null;

  switch (platform) {
    case 'instagram':
      return `https://www.instagram.com/${handle}/`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'youtube':
      return `https://www.youtube.com/@${handle}`;
    default:
      return null;
  }
}

function sortWeight(status: InfluencerApplicationStatus) {
  switch (status) {
    case 'rejected':
      return 2;
    case 'approved':
      return 1;
    default:
      return 0;
  }
}

function statusClass(status: InfluencerApplicationStatus) {
  switch (status) {
    case 'approved':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'rejected':
      return 'bg-gray-100 text-gray-500 border-gray-200';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
}

function formatStatus(status: InfluencerApplicationStatus, t: (key: string) => string) {
  switch (status) {
    case 'approved':
      return t('applications.statusApproved');
    case 'rejected':
      return t('applications.statusRejected');
    default:
      return t('applications.statusPending');
  }
}

function formatApplicationDate(value: string | null) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export default async function InfluencerApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sort?: string; order?: SortOrder }>;
}) {
  const { locale, t } = await getI18n();
  const currentSearchParams = await searchParams;
  const { error } = currentSearchParams;
  const admin = createAdminClient();
  const { data } = await admin
    .from('influencer_applications')
    .select('*')
    .order('created_at', { ascending: false });

  const currentSort = currentSearchParams.sort ?? 'status';
  const currentOrder = currentSearchParams.order === 'desc' ? 'desc' : 'asc';
  const applications = sortItems((data ?? []) as InfluencerApplication[], (application) => {
    switch (currentSort) {
      case 'platform':
        return normalizePlatform(application.platform);
      case 'handle':
        return normalizeHandle(application.account_id);
      case 'gender':
        return application.gender ?? '';
      case 'age_group':
        return application.age_group ?? '';
      case 'created_at':
        return application.created_at ?? '';
      default:
        return sortWeight(application.status);
    }
  }, currentOrder);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('applications.title')}</h1>
        <p className="mt-2 text-sm text-gray-500">{t('applications.description')}</p>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <div className="space-y-4 lg:hidden">
        {applications.map((application) => {
          const platform = normalizePlatform(application.platform);
          const handle = normalizeHandle(application.account_id);
          const accountUrl = buildAccountUrl(platform, handle);
          const rejected = application.status === 'rejected';
          const approved = application.status === 'approved';
          const approveAction = `/influencers/applications/${application.id}/approve`;
          const rejectAction = `/influencers/applications/${application.id}/reject`;
          const restoreAction = `/influencers/applications/${application.id}/restore`;
          const deleteAction = `/influencers/applications/${application.id}/delete`;

          return (
            <div
              key={application.id}
              className={`rounded-xl border bg-white p-4 shadow-sm ${rejected ? 'border-gray-200 bg-gray-50 text-gray-500' : 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ChannelIcon channel={platform} />
                    <span>{channelLabel(platform, locale)}</span>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-black">@{handle}</div>
                  <div className="mt-2 text-sm">{t('applications.applicationDate')}: {formatApplicationDate(application.created_at)}</div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(application.status)}`}>
                  {formatStatus(application.status, t)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">{t('common.gender')}</div>
                  <div>{application.gender || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500">{t('common.age')}</div>
                  <div>{application.age_group || '-'}</div>
                </div>
              </div>

              {accountUrl ? (
                <a
                  href={accountUrl}
                  target="_blank"
                  className="mt-4 inline-flex text-sm text-blue-600 hover:underline"
                >
                  {t('influencer.openAccount')}
                </a>
              ) : null}

              <div className="mt-4 flex gap-2">
                <form action={approveAction} method="post" className="flex-1">
                    <button
                      type="submit"
                      className={`w-full rounded px-3 py-2 text-sm font-medium ${
                        approved ? 'bg-blue-100 text-blue-700' : 'bg-black text-white'
                      }`}
                  >
                    {approved ? t('applications.approved') : t('applications.approve')}
                  </button>
                </form>
                {!approved ? (
                  <form action={rejected ? restoreAction : rejectAction} method="post" className="flex-1">
                    <button
                      type="submit"
                      className={`w-full rounded border px-3 py-2 text-sm font-medium ${
                        rejected ? 'border-gray-300 bg-gray-200 text-gray-500' : 'border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      {rejected ? t('applications.rejectUndo') : t('applications.reject')}
                    </button>
                  </form>
                ) : null}
                <form action={deleteAction} method="post" className="flex-1">
                  <ConfirmSubmitButton
                    message={t('applications.deleteConfirm')}
                    className="w-full rounded border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600"
                  >
                    {t('applications.deleteHistory')}
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          );
        })}

        {!applications.length ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-400">
            {t('applications.none')}
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto rounded-lg bg-white shadow lg:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3"><SortableHeaderLink label={t('influencerForm.channel')} sortKey="platform" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('influencer.handle')} sortKey="handle" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.gender')} sortKey="gender" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.age')} sortKey="age_group" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('applications.applicationDate')} sortKey="created_at" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3"><SortableHeaderLink label={t('common.status')} sortKey="status" currentSort={currentSort} currentOrder={currentOrder} searchParams={currentSearchParams} /></th>
              <th className="p-3">{t('common.management')}</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => {
              const platform = normalizePlatform(application.platform);
              const handle = normalizeHandle(application.account_id);
              const accountUrl = buildAccountUrl(platform, handle);
              const rejected = application.status === 'rejected';
              const approved = application.status === 'approved';
              const approveAction = `/influencers/applications/${application.id}/approve`;
              const rejectAction = `/influencers/applications/${application.id}/reject`;
              const restoreAction = `/influencers/applications/${application.id}/restore`;
              const deleteAction = `/influencers/applications/${application.id}/delete`;

              return (
                <tr key={application.id} className={`border-t ${rejected ? 'bg-gray-100 text-gray-500' : ''}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <ChannelIcon channel={platform} />
                      <span>{channelLabel(platform, locale)}</span>
                    </div>
                  </td>
                  <td className="p-3 font-medium">
                    {accountUrl ? (
                      <a href={accountUrl} target="_blank" className="text-blue-600 hover:underline">
                        @{handle}
                      </a>
                    ) : (
                      <span>@{handle}</span>
                    )}
                  </td>
                  <td className="p-3">{application.gender || '-'}</td>
                  <td className="p-3">{application.age_group || '-'}</td>
                  <td className="p-3">{formatApplicationDate(application.created_at)}</td>
                  <td className="p-3">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(application.status)}`}>
                      {formatStatus(application.status, t)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <form action={approveAction} method="post">
                        <button
                          type="submit"
                          className={`rounded px-3 py-1.5 text-sm font-medium ${
                            approved ? 'bg-blue-100 text-blue-700' : 'bg-black text-white'
                          }`}
                        >
                          {approved ? t('applications.approved') : t('applications.approve')}
                        </button>
                      </form>
                      {!approved ? (
                        <form action={rejected ? restoreAction : rejectAction} method="post">
                          <button
                            type="submit"
                            className={`rounded border px-3 py-1.5 text-sm font-medium ${
                              rejected ? 'border-gray-300 bg-gray-200 text-gray-500' : 'border-gray-300 bg-white text-gray-700'
                            }`}
                          >
                            {rejected ? t('applications.rejectUndo') : t('applications.reject')}
                          </button>
                        </form>
                      ) : null}
                      <form action={deleteAction} method="post">
                        <ConfirmSubmitButton
                          message={t('applications.deleteConfirm')}
                          className="rounded border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600"
                        >
                          {t('applications.deleteHistory')}
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!applications.length ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  {t('applications.none')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
