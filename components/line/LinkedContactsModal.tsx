'use client';

import { useState } from 'react';
import SubmitButton from '@/components/SubmitButton';
import { linkLineContactAction, unlinkLineContactAction } from '@/actions/line-contacts';
import { useI18n } from '@/lib/i18n/provider';

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

export default function LinkedContactsModal({
  contacts,
  influencers,
}: {
  contacts: LineContact[];
  influencers: InfluencerOption[];
}) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
      >
        {t('lineContacts.viewLinked')} ({contacts.length})
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">{t('lineContacts.linkedListTitle')}</h2>
                <p className="mt-1 text-sm text-gray-500">{t('lineContacts.linkedListDescription')}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                {t('common.cancel')}
              </button>
            </div>

            <div className="max-h-[calc(85vh-88px)] overflow-y-auto divide-y divide-gray-100">
              {contacts.map((contact) => {
                const linked = influencers.find((influencer) =>
                  influencer.id === contact.linked_influencer_id || influencer.line_id === contact.line_user_id
                );

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
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {t('lineContacts.linked')}
                          </span>
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
                        <select
                          name="influencer_id"
                          defaultValue={linked?.id ?? ''}
                          className="min-w-0 flex-1 rounded border border-gray-300 bg-white p-2 text-sm"
                          required
                        >
                          <option value="">{t('lineContacts.selectInfluencer')}</option>
                          {influencers.map((influencer) => (
                            <option key={influencer.id} value={influencer.id}>
                              @{influencer.handle}{influencer.line_id ? ` (${t('lineContacts.hasLineId')})` : ''}
                            </option>
                          ))}
                        </select>
                        <SubmitButton>{t('lineContacts.relink')}</SubmitButton>
                      </form>

                      {linked ? (
                        <form action={unlinkLineContactAction} className="text-right">
                          <input type="hidden" name="contact_id" value={contact.id} />
                          <input type="hidden" name="influencer_id" value={linked.id} />
                          <input type="hidden" name="line_user_id" value={contact.line_user_id} />
                          <button type="submit" className="text-sm text-red-500 hover:underline">
                            {t('lineContacts.unlink')}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {!contacts.length ? (
                <div className="px-6 py-12 text-center text-sm text-gray-400">
                  {t('lineContacts.noLinked')}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
