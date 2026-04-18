'use client';
import { useEffect, useMemo, useState } from 'react';
import { createScheduleAction, updateScheduleAction } from '@/actions/schedules';
import SubmitButton from '@/components/SubmitButton';
import { useI18n } from '@/lib/i18n/provider';

type InfOpt = { id: number; handle: string };
type CliOpt = {
  id: number;
  company_name: string;
  store_name_ja?: string | null;
  postal_code?: string | null;
  region?: string | null;
  district?: string | null;
  road_address?: string | null;
  building_detail?: string | null;
  address_ja?: string | null;
  business_hours?: string | null;
  provided_menu?: string | null;
};

function koreanAddress(client: CliOpt | null) {
  if (!client) return '';
  const fullAddress = [client.region, client.district, client.road_address, client.building_detail]
    .filter(Boolean)
    .join(' ');
  if (!fullAddress) return '';
  return `${client.postal_code ? `(${client.postal_code}) ` : ''}${fullAddress}`;
}

export default function ScheduleForm({
  influencers, clients, schedule,
}: { influencers: InfOpt[]; clients: CliOpt[]; schedule?: any }) {
  const { t } = useI18n();
  const initInf = schedule ? influencers.find(i => i.id === schedule.influencer_id) ?? null : null;
  const initDate = schedule ? new Date(schedule.scheduled_at) : null;
  const pad = (n: number) => String(n).padStart(2, '0');

  const [query, setQuery] = useState('');
  const [selInf, setSelInf] = useState<InfOpt | null>(initInf);
  const [selCli, setSelCli] = useState<number | ''>(schedule?.client_id ?? '');
  const [date, setDate] = useState(initDate ? `${initDate.getFullYear()}-${pad(initDate.getMonth()+1)}-${pad(initDate.getDate())}` : '');
  const [hour, setHour] = useState(initDate ? String(initDate.getHours()) : '10');
  const [minute, setMinute] = useState(initDate ? (initDate.getMinutes() >= 30 ? '30' : '00') : '00');
  const [providedMenu, setProvidedMenu] = useState(schedule?.provided_menu ?? '');
  const [additionalRequests, setAdditionalRequests] = useState(schedule?.additional_requests ?? '');
  const [memo, setMemo] = useState(schedule?.memo ?? '');

  const filtered = useMemo(() => {
    if (!query) return influencers.slice(0, 8);
    return influencers.filter(i => i.handle.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  }, [query, influencers]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === Number(selCli)) ?? null,
    [clients, selCli]
  );

  const scheduledAt = date && `${date}T${hour.padStart(2,'0')}:${minute}:00+09:00`;
  const canSubmit = selInf && selCli && date;

  useEffect(() => {
    if (!selectedClient) {
      if (!schedule) setProvidedMenu('');
      return;
    }

    if (!schedule || Number(schedule.client_id) !== selectedClient.id) {
      setProvidedMenu(selectedClient.provided_menu ?? '');
      return;
    }

    setProvidedMenu(schedule.provided_menu ?? selectedClient.provided_menu ?? '');
  }, [schedule, selectedClient]);

  return (
    <form action={schedule ? updateScheduleAction : createScheduleAction}
      className="bg-white p-6 rounded-lg shadow space-y-5 max-w-2xl">
      {schedule && <input type="hidden" name="id" defaultValue={schedule.id} />}
      <input type="hidden" name="scheduled_at" value={scheduledAt || ''} />
      <input type="hidden" name="influencer_id" value={selInf?.id ?? ''} />
      <input type="hidden" name="client_id" value={selCli} />

      <div>
        <label className="text-sm block mb-1 font-medium">{t('scheduleForm.handle')}</label>
        {selInf ? (
          <div className="flex items-center gap-2">
            <span className="px-3 py-2 bg-blue-50 border border-blue-300 rounded">@{selInf.handle}</span>
            <button type="button" onClick={() => { setSelInf(null); setSelCli(''); }}
              className="text-sm text-red-500">{t('common.change')}</button>
          </div>
        ) : (
          <>
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder={t('postForm.searchHandle')} className="w-full border border-gray-400 rounded p-2" />
            {query && filtered.length > 0 && (
              <div className="border border-gray-300 rounded mt-1 max-h-48 overflow-auto">
                {filtered.map((i) => (
                  <button type="button" key={i.id} onClick={() => setSelInf(i)}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100">@{i.handle}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <label className="text-sm block mb-1 font-medium">{t('scheduleForm.client')}</label>
        <select value={selCli} onChange={(e) => setSelCli(Number(e.target.value) || '')}
          disabled={!selInf}
          className="w-full border border-gray-400 rounded p-2 disabled:bg-gray-100">
          <option value="">{t('scheduleForm.selectClient')}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.company_name}</option>
          ))}
        </select>
      </div>

      {selectedClient && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <h2 className="text-sm font-semibold">{t('scheduleForm.clientInfo')}</h2>
          <InfoRow label={t('clientForm.storeNameJa')} value={selectedClient.store_name_ja || '-'} />
          <InfoRow label={t('scheduleForm.addressKo')} value={koreanAddress(selectedClient) || '-'} />
          <InfoRow label={t('scheduleForm.addressJa')} value={selectedClient.address_ja || '-'} />
          <InfoRow label={t('scheduleForm.businessHours')} value={selectedClient.business_hours || '-'} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm block mb-1 font-medium">{t('scheduleForm.date')}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-400 rounded p-2" />
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">{t('scheduleForm.hour')}</label>
          <select value={hour} onChange={(e) => setHour(e.target.value)}
            className="w-full border border-gray-400 rounded p-2">
            {Array.from({length:24}, (_,h) => (
              <option key={h} value={String(h)}>{String(h).padStart(2,'0')}{t('scheduleForm.hourSuffix')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">{t('scheduleForm.minute')}</label>
          <select value={minute} onChange={(e) => setMinute(e.target.value)}
            className="w-full border border-gray-400 rounded p-2">
            <option value="00">{t('scheduleForm.minute00')}</option>
            <option value="30">{t('scheduleForm.minute30')}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm block mb-1 font-medium">{t('scheduleForm.providedMenu')}</label>
        <textarea
          name="provided_menu"
          value={providedMenu}
          onChange={(e) => setProvidedMenu(e.target.value)}
          rows={3}
          placeholder={t('scheduleForm.providedMenuHelp')}
          className="w-full border border-gray-400 rounded p-2"
        />
      </div>

      <div>
        <label className="text-sm block mb-1 font-medium">{t('scheduleForm.additionalRequests')}</label>
        <textarea
          name="additional_requests"
          value={additionalRequests}
          onChange={(e) => setAdditionalRequests(e.target.value)}
          rows={4}
          placeholder={t('scheduleForm.additionalRequestsHelp')}
          className="w-full border border-gray-400 rounded p-2"
        />
      </div>

      <div>
        <label className="text-sm block mb-1 font-medium">{t('scheduleForm.note')}</label>
        <textarea name="memo" value={memo} onChange={(e) => setMemo(e.target.value)}
          rows={2} className="w-full border border-gray-400 rounded p-2" />
      </div>

      <SubmitButton>{schedule ? t('common.edit') : t('common.create')}</SubmitButton>
    </form>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
      <div className="text-xs text-gray-500 sm:w-24 sm:flex-shrink-0">{label}</div>
      <div className="text-sm font-medium whitespace-pre-wrap">{value}</div>
    </div>
  );
}
