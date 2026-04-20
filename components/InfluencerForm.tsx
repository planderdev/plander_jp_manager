'use client';
import { useState } from 'react';
import type { Influencer, ChannelType } from '@/types/db';
import PhoneInput from '@/components/PhoneInput';
import SubmitButton from '@/components/SubmitButton';
import { useI18n } from '@/lib/i18n/provider';

export default function InfluencerForm({
  influencer, action, profileScreenshotUrl,
}: { influencer?: Influencer; action: (fd: FormData) => void; profileScreenshotUrl?: string | null }) {
  const i = influencer;
  const { t } = useI18n();
  const [channel, setChannel] = useState<ChannelType>(i?.channel ?? 'instagram');
  const [handle, setHandle] = useState(i?.handle ?? '');
  const [accountUrl, setAccountUrl] = useState(i?.account_url ?? '');
  const [urlTouched, setUrlTouched] = useState(false);

  const [nameEn, setNameEn] = useState(i?.name_en ?? '');
  const [bankName, setBankName] = useState(i?.bank_name ?? '');
  const [branchName, setBranchName] = useState(i?.branch_name ?? '');
  const [accountNumber, setAccountNumber] = useState(i?.account_number ?? '');
  const [postalCode, setPostalCode] = useState(i?.postal_code ?? '');

  const toUpper = (v: string) => v.replace(/[^A-Za-z ]/g, '').toUpperCase();
  const toNum = (v: string) => v.replace(/[^0-9]/g, '');

  function buildUrl(ch: ChannelType, h: string) {
    const clean = h.trim().replace(/^@/, '');
    if (!clean) return '';
    switch (ch) {
      case 'instagram': return `https://www.instagram.com/${clean}/`;
      case 'tiktok':    return `https://www.tiktok.com/@${clean}`;
      case 'youtube':   return `https://www.youtube.com/@${clean}`;
      default:          return '';
    }
  }
  function onChannelChange(v: ChannelType) {
    setChannel(v);
    if (!urlTouched) setAccountUrl(buildUrl(v, handle));
  }
  function onHandleChange(v: string) {
    setHandle(v);
    if (!urlTouched) setAccountUrl(buildUrl(channel, v));
  }

  return (
    <form action={action} className="bg-white p-6 rounded-lg shadow space-y-6 max-w-3xl">
      {i && <input type="hidden" name="id" defaultValue={i.id} />}

      <div className="space-y-3">
        <h2 className="text-base font-semibold border-b border-gray-300 pb-1">{t('common.basicInfo')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm block mb-1 font-medium">{t('influencerForm.channel')}</label>
            <select name="channel" value={channel}
              onChange={(e) => onChannelChange(e.target.value as ChannelType)}
              required className="w-full border border-gray-400 rounded p-2">
              <option value="instagram">{t('channel.instagram')}</option>
              <option value="tiktok">{t('channel.tiktok')}</option>
              <option value="youtube">{t('channel.youtube')}</option>
              <option value="other">{t('channel.other')}</option>
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">{t('influencerForm.handle')}</label>
            <input name="handle" value={handle} required
              onChange={(e) => onHandleChange(e.target.value)}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">{t('influencerForm.followers')}</label>
            <input name="followers" type="number" required defaultValue={i?.followers ?? ''}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">{t('influencerForm.unitPrice')}</label>
            <input name="unit_price" type="number" required defaultValue={i?.unit_price ?? ''}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">{t('influencerForm.age')}</label>
            <input name="age" type="number" min="0" max="120" defaultValue={i?.age ?? ''}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">{t('influencerForm.gender')}</label>
            <select name="gender" defaultValue={i?.gender ?? ''}
              className="w-full border border-gray-400 rounded p-2">
              <option value="">{t('common.none')}</option>
              <option value="female">{t('gender.female')}</option>
              <option value="male">{t('gender.male')}</option>
              <option value="other">{t('gender.other')}</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">{t('influencerForm.accountUrl')}</label>
          <input name="account_url" value={accountUrl} required
            onChange={(e) => { setAccountUrl(e.target.value); setUrlTouched(true); }}
            className="w-full border border-gray-400 rounded p-2" />
          <p className="text-xs text-gray-600 mt-1">{t('influencerForm.accountUrlHelp')}</p>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">{t('influencerForm.note')}</label>
          <textarea name="memo" defaultValue={i?.memo ?? ''} rows={2}
            className="w-full border border-gray-400 rounded p-2" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold border-b border-gray-300 pb-1">{t('common.settlementInfo')}</h2>

        <div>
          <label className="text-sm block mb-1 font-medium">{t('influencerForm.nameEn')}</label>
          <input name="name_en" value={nameEn}
            onChange={(e) => setNameEn(toUpper(e.target.value))}
            onCompositionEnd={(e: any) => setNameEn(toUpper(e.target.value))}
            lang="en" inputMode="text"
            className="w-full border border-gray-400 rounded p-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm block mb-1 font-medium">{t('influencerForm.bankName')}</label>
            <input name="bank_name" value={bankName}
              onChange={(e) => setBankName(toUpper(e.target.value))}
              onCompositionEnd={(e: any) => setBankName(toUpper(e.target.value))}
              lang="en" inputMode="text"
              className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">{t('influencerForm.branchName')}</label>
            <input name="branch_name" value={branchName}
              onChange={(e) => setBranchName(toUpper(e.target.value))}
              onCompositionEnd={(e: any) => setBranchName(toUpper(e.target.value))}
              lang="en" inputMode="text"
              className="w-full border border-gray-400 rounded p-2" />
          </div>
        </div>

        <div>
          <label className="text-sm block mb-1 font-medium">{t('influencerForm.accountNumber')}</label>
          <input name="account_number" value={accountNumber}
            onChange={(e) => setAccountNumber(toNum(e.target.value))}
            onCompositionEnd={(e: any) => setAccountNumber(toNum(e.target.value))}
            inputMode="numeric"
            className="w-full border border-gray-400 rounded p-2" />
        </div>

        <div>
          <label className="text-sm block mb-1 font-medium">{t('influencerForm.phone')}</label>
          <PhoneInput name="phone" defaultValue={i?.phone ?? ''} />
        </div>

        <div className="pt-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('influencerForm.addressJapan')}</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm block mb-1 font-medium">{t('influencerForm.postalCode')}</label>
              <input name="postal_code" value={postalCode}
                onChange={(e) => setPostalCode(toNum(e.target.value))}
                onCompositionEnd={(e: any) => setPostalCode(toNum(e.target.value))}
                inputMode="numeric"
                className="w-full border border-gray-400 rounded p-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm block mb-1 font-medium">{t('influencerForm.prefecture')}</label>
                <input name="prefecture" defaultValue={i?.prefecture ?? ''}
                  className="w-full border border-gray-400 rounded p-2" />
              </div>
              <div>
                <label className="text-sm block mb-1 font-medium">{t('influencerForm.city')}</label>
                <input name="city" defaultValue={i?.city ?? ''}
                  className="w-full border border-gray-400 rounded p-2" />
              </div>
            </div>
            <div>
              <label className="text-sm block mb-1 font-medium">{t('influencerForm.street')}</label>
              <input name="street" defaultValue={i?.street ?? ''}
                className="w-full border border-gray-400 rounded p-2" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm block mb-1 font-medium">{t('influencerForm.contactStatus')}</label>
        <select name="contact_status" defaultValue={i?.contact_status ?? 'active'}
          className="w-full border border-gray-400 rounded p-2 max-w-xs">
          <option value="active">{t('contact.active')}</option>
          <option value="inactive">{t('contact.inactive')}</option>
          <option value="blocked">{t('contact.blocked')}</option>
        </select>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold border-b border-gray-300 pb-1">{t('influencer.profileScreenshot')}</h2>
        <div>
          <label className="text-sm block mb-1 font-medium">{t('influencerForm.profileScreenshot')}</label>
          <input type="file" name="profile_screenshot" accept=".png,.jpg,.jpeg,.webp" className="block text-sm" />
          <p className="text-xs text-gray-500 mt-1">{t('influencerForm.profileScreenshotHelp')}</p>
        </div>
        {profileScreenshotUrl ? (
          <div className="space-y-2">
            <img
              src={profileScreenshotUrl}
              alt="Profile screenshot"
              className="max-w-xs rounded-xl border border-gray-200"
            />
            <label className="inline-flex items-center gap-2 text-sm text-red-600">
              <input type="checkbox" name="remove_profile_screenshot" />
              {t('common.remove')}
            </label>
          </div>
        ) : null}
      </div>

      <SubmitButton>{t('common.save')}</SubmitButton>
    </form>
  );
}
