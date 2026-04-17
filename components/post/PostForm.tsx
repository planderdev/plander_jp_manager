'use client';
import { useState, useMemo } from 'react';
import { upsertPostAction } from '@/actions/posts';
import SubmitButton from '@/components/SubmitButton';
import { fullLocalized } from '@/lib/datetime';
import { useI18n } from '@/lib/i18n/provider';

type InfOpt = { id: number; handle: string; account_url: string | null; unit_price: number | null; name_en: string | null; bank_name: string | null; branch_name: string | null; account_number: string | null; phone: string | null; prefecture: string | null; city: string | null; street: string | null };
type CliOpt = { id: number; company_name: string };
type ScheduleOpt = { id: number; scheduled_at: string; client_id: number; influencer_id: number };



export default function PostForm({
  influencers, clients, post, schedules,
}: { influencers: InfOpt[]; clients: CliOpt[]; post?: any; schedules: ScheduleOpt[] }) {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState('');
  const [selInf, setSelInf] = useState<InfOpt | null>(
    post ? influencers.find(i => i.id === post.influencer_id) ?? null : null
  );
  const [selCli, setSelCli] = useState<number | ''>(post?.client_id ?? '');
  const [status, setStatus] = useState(post?.settlement_status ?? 'pending');
  const selCliObj = clients.find(c => c.id === Number(selCli));
  const [selScheduleId, setSelScheduleId] = useState<number | ''>(post?.schedule_id ?? '');

  const filtered = useMemo(() => {
    if (!query) return influencers.slice(0, 8);
    return influencers.filter(i => i.handle.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  }, [query, influencers]);
  const matchingSchedules = useMemo(() => {
  if (!selInf || !selCli) return [];
  return schedules.filter(s =>
    s.influencer_id === selInf.id && s.client_id === Number(selCli)
  );
}, [selInf, selCli, schedules]);


  return (
    <form action={upsertPostAction} className="space-y-6 max-w-3xl">
      {post && <input type="hidden" name="id" defaultValue={post.id} />}
      <input type="hidden" name="influencer_id" value={selInf?.id ?? ''} />
      <input type="hidden" name="client_id" value={selCli} />
      <input type="hidden" name="schedule_id" value={selScheduleId} />

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="text-sm block mb-1 font-medium">{t('postForm.handle')}</label>
          {selInf ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 bg-blue-50 border border-blue-300 rounded">@{selInf.handle}</span>
              <button type="button" onClick={() => { setSelInf(null); setSelCli(''); setSelScheduleId(''); }}
                className="text-sm text-red-500">{t('common.change')}</button>
            </div>
          ) : (
            <>
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={t('postForm.searchHandle')} className="w-full border border-gray-400 rounded p-2" />
              {filtered.length > 0 && (
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
          <label className="text-sm block mb-1 font-medium">{t('postForm.client')}</label>
          <select value={selCli} onChange={(e) => { setSelCli(Number(e.target.value) || ''); setSelScheduleId(''); }}
            disabled={!selInf} required
            className="w-full border border-gray-400 rounded p-2 disabled:bg-gray-100">
            <option value="">{t('postForm.selectClient')}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
          {selInf && selCli && (
            <div>
              <label className="text-sm block mb-1 font-medium">{t('postForm.linkSchedule')}</label>
              <select value={selScheduleId}
                onChange={(e) => setSelScheduleId(Number(e.target.value) || '')}
                className="w-full border border-gray-400 rounded p-2">
                <option value="">{t('postForm.noLink')}</option>
                {matchingSchedules.map((s) => (
                  <option key={s.id} value={s.id}>{fullLocalized(s.scheduled_at, locale)}</option>
                ))}
              </select>
              {matchingSchedules.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">{t('postForm.noMatchingSchedules')}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {selInf && selCliObj && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">{t('common.readOnlySummary')}</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Read label={t('postForm.company')} value={selCliObj.company_name} />
            <Read label={t('postForm.influencer')} value={`@${selInf.handle}`} />
            <Read label={t('postForm.accountLink')} value={selInf.account_url} link />
            <Read label={t('common.unitPrice')} value={selInf.unit_price != null ? `¥${selInf.unit_price.toLocaleString()}` : '-'} />
            <Read label={t('postForm.nameEn')} value={selInf.name_en} />
            <Read label={t('postForm.bankBranch')} value={[selInf.bank_name, selInf.branch_name].filter(Boolean).join(' / ') || '-'} />
            <Read label={t('postForm.accountNumber')} value={selInf.account_number} />
            <Read label={t('common.phone')} value={selInf.phone} />
            <Read label={t('postForm.address')} value={[selInf.prefecture, selInf.city, selInf.street].filter(Boolean).join(' ') || '-'} />
          </div>
        </div>
      )}

      {selInf && selCli && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="text-sm font-semibold">{t('postForm.sectionTitle')}</h3>

          <Field name="post_url" label={t('postForm.postUrl')} defaultValue={post?.post_url ?? ''} />

          <Field name="uploaded_on" label={t('postForm.uploadedOn')} type="date" defaultValue={post?.uploaded_on ?? ''} />

          <div>
            <label className="text-sm block mb-1 font-medium">{t('postForm.settlementStatus')}</label>
            <select name="settlement_status" value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full border border-gray-400 rounded p-2 max-w-xs">
              <option value="pending">{t('postForm.pending')}</option>
              <option value="done">{t('postForm.done')}</option>
            </select>
          </div>

          {status === 'done' && (
            <Field name="settled_on" label={t('postForm.settledOn')}
              defaultValue={post?.settled_on?.replaceAll('-','') ?? ''}
              placeholder="20260411" />
          )}

          <div>
            <label className="text-sm block mb-1 font-medium">{t('postForm.paymentProof')}</label>
            <input type="file" name="payment_proof" accept="image/png,image/jpeg" />
            {post?.payment_proof_path && (
              <p className="text-xs text-gray-600 mt-1">{t('postForm.fileExists')}</p>
            )}
          </div>

          <SubmitButton>{t('common.save')}</SubmitButton>
        </div>
      )}
    </form>
  );
}

function Read({ label, value, link }: { label: string; value: any; link?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      {link && value
        ? <a href={value} target="_blank" className="text-blue-600 hover:underline break-all">{value}</a>
        : <div className="font-medium">{value ?? '-'}</div>}
    </div>
  );
}
function Field({ name, label, type='text', defaultValue, placeholder }: any) {
  return (
    <div>
      <label className="text-sm block mb-1 font-medium">{label}</label>
      <input name={name} type={type} defaultValue={defaultValue ?? ''} placeholder={placeholder}
        className="w-full border border-gray-400 rounded p-2" />
    </div>
  );
}
