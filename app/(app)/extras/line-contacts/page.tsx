import { createAdminClient } from '@/lib/supabase/admin';
import { getI18n } from '@/lib/i18n/server';
import { normalizeLineMatchValue } from '@/lib/line-contacts';
import { linkLineContactAction } from '@/actions/line-contacts';
import SubmitButton from '@/components/SubmitButton';
import LinkedContactsModal from '@/components/line/LinkedContactsModal';

type LineContact = {
  id: number;
  line_user_id: string;
  source_type: string | null;
  display_name: string | null;
  picture_url: string | null;
  status_message: string | null;
  last_message_text: string | null;
  last_event_type: string | null;
  last_received_at: string;
  linked_influencer_id: number | null;
  linked_at: string | null;
};

type InfluencerOption = {
  id: number;
  handle: string;
  line_id: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

function findSuggestedInfluencer(contact: LineContact, influencers: InfluencerOption[]) {
  const displayName = normalizeLineMatchValue(contact.display_name);
  const message = normalizeLineMatchValue(contact.last_message_text);
  const lineUserId = contact.line_user_id;

  return influencers.find((influencer) => {
    if (influencer.line_id === lineUserId) return true;
    const handle = normalizeLineMatchValue(influencer.handle);
    return Boolean(handle && (handle === displayName || handle === message));
  }) ?? null;
}

export default async function LineContactsPage() {
  const { t } = await getI18n();
  const sb = createAdminClient();
  const [{ data: contacts }, { data: influencers }] = await Promise.all([
    sb.from('line_contacts').select('*').order('last_received_at', { ascending: false }),
    sb.from('influencers').select('id, handle, line_id').order('handle'),
  ]);

  const contactRows = (contacts ?? []) as LineContact[];
  const influencerRows = (influencers ?? []) as InfluencerOption[];
  const pendingContacts = contactRows.filter((contact) => !contact.linked_influencer_id);
  const linkedContacts = contactRows.filter((contact) => contact.linked_influencer_id);
  const pendingCount = pendingContacts.length;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('lineContacts.title')}</h1>
          <p className="mt-2 text-sm text-gray-500">{t('lineContacts.description')}</p>
        </div>
        <LinkedContactsModal contacts={linkedContacts} influencers={influencerRows} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label={t('lineContacts.total')} value={contactRows.length} />
        <StatCard label={t('lineContacts.pending')} value={pendingCount} />
        <StatCard label={t('lineContacts.linked')} value={contactRows.length - pendingCount} />
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold">{t('lineContacts.inbox')}</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {pendingContacts.map((contact) => {
            const suggested = findSuggestedInfluencer(contact, influencerRows);
            const linked = influencerRows.find((influencer) =>
              influencer.id === contact.linked_influencer_id || influencer.line_id === contact.line_user_id
            );
            const defaultInfluencerId = linked?.id ?? suggested?.id ?? '';

            return (
              <div key={contact.id} className="grid gap-4 px-6 py-5 lg:grid-cols-[1fr_360px] lg:items-center">
                <div className="flex gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                    {contact.picture_url ? (
                      <img src={contact.picture_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-400">LINE</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{contact.display_name ?? t('lineContacts.unknownName')}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${linked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {linked ? t('lineContacts.linked') : t('lineContacts.pending')}
                      </span>
                      {suggested && !linked ? (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {t('lineContacts.suggested')}: @{suggested.handle}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 break-all text-xs text-gray-400">{contact.line_user_id}</p>
                    <p className="mt-2 text-sm text-gray-600">{contact.last_message_text || t('lineContacts.noMessage')}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {formatDate(contact.last_received_at)} · {contact.last_event_type ?? '-'} · {contact.source_type ?? '-'}
                    </p>
                    {linked ? (
                      <p className="mt-2 text-sm font-medium text-emerald-700">@{linked.handle} {t('lineContacts.connectedTo')}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 rounded-2xl bg-gray-50 p-3">
                  <form action={linkLineContactAction} className="flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="contact_id" value={contact.id} />
                    <input type="hidden" name="line_user_id" value={contact.line_user_id} />
                    <select name="influencer_id" defaultValue={defaultInfluencerId} className="min-w-0 flex-1 rounded border border-gray-300 bg-white p-2 text-sm" required>
                      <option value="">{t('lineContacts.selectInfluencer')}</option>
                      {influencerRows.map((influencer) => (
                        <option key={influencer.id} value={influencer.id}>
                          @{influencer.handle}{influencer.line_id ? ` (${t('lineContacts.hasLineId')})` : ''}
                        </option>
                      ))}
                    </select>
                    <SubmitButton>{linked ? t('lineContacts.relink') : t('lineContacts.link')}</SubmitButton>
                  </form>
                </div>
              </div>
            );
          })}

          {!pendingContacts.length && (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              {t('lineContacts.noPending')}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}
