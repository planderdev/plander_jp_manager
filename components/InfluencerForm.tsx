'use client';
import { useState } from 'react';
import type { Influencer, ChannelType } from '@/types/db';
import PhoneInput from '@/components/PhoneInput';
import SubmitButton from '@/components/SubmitButton';



export default function InfluencerForm({
  influencer, action,
}: { influencer?: Influencer; action: (fd: FormData) => void }) {
  const i = influencer;
  const [channel, setChannel] = useState<ChannelType>(i?.channel ?? 'instagram');
  const [handle, setHandle] = useState(i?.handle ?? '');
  const [accountUrl, setAccountUrl] = useState(i?.account_url ?? '');
  const [urlTouched, setUrlTouched] = useState(false);

  // 정산정보 상태 (제어 컴포넌트)
  const [nameEn, setNameEn] = useState(i?.name_en ?? '');
  const [bankName, setBankName] = useState(i?.bank_name ?? '');
  const [branchName, setBranchName] = useState(i?.branch_name ?? '');
  const [accountNumber, setAccountNumber] = useState(i?.account_number ?? '');
  const [postalCode, setPostalCode] = useState(i?.postal_code ?? '');

  // 입력 필터
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

      {/* 기본 정보 */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold border-b border-gray-300 pb-1">기본 정보</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm block mb-1 font-medium">채널 *</label>
            <select name="channel" value={channel}
              onChange={(e) => onChannelChange(e.target.value as ChannelType)}
              required className="w-full border border-gray-400 rounded p-2">
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="other">기타</option>
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">인플루언서 아이디 *</label>
            <input name="handle" value={handle} required
              onChange={(e) => onHandleChange(e.target.value)}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">묶음 ID</label>
            <input name="bundle_id" defaultValue={influencer?.bundle_id ?? ''}
              placeholder="같은 사람이 다른 채널 운영 시 같은 값 입력"
              className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">팔로워수 *</label>
            <input name="followers" type="number" required defaultValue={i?.followers ?? ''}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">단가 *</label>
            <input name="unit_price" type="number" required defaultValue={i?.unit_price ?? ''}
              className="w-full border border-gray-400 rounded p-2" />
          </div>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">계정 링크 *</label>
          <input name="account_url" value={accountUrl} required
            onChange={(e) => { setAccountUrl(e.target.value); setUrlTouched(true); }}
            className="w-full border border-gray-400 rounded p-2" />
          <p className="text-xs text-gray-600 mt-1">아이디 입력시 자동 생성됩니다. 직접 수정도 가능.</p>
        </div>
        <div>
          <label className="text-sm block mb-1 font-medium">비고</label>
          <textarea name="memo" defaultValue={i?.memo ?? ''} rows={2}
            className="w-full border border-gray-400 rounded p-2" />
        </div>
      </div>

      {/* 정산 정보 (주소 포함) */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold border-b border-gray-300 pb-1">정산 정보</h2>

        <div>
          <label className="text-sm block mb-1 font-medium">이름 (영문 대문자)</label>
          <input name="name_en" value={nameEn}
            onChange={(e) => setNameEn(toUpper(e.target.value))}
            onCompositionEnd={(e: any) => setNameEn(toUpper(e.target.value))}
            lang="en" inputMode="text"
            className="w-full border border-gray-400 rounded p-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm block mb-1 font-medium">은행명 (영문 대문자)</label>
            <input name="bank_name" value={bankName}
              onChange={(e) => setBankName(toUpper(e.target.value))}
              onCompositionEnd={(e: any) => setBankName(toUpper(e.target.value))}
              lang="en" inputMode="text"
              className="w-full border border-gray-400 rounded p-2" />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">지점명 (영문 대문자)</label>
            <input name="branch_name" value={branchName}
              onChange={(e) => setBranchName(toUpper(e.target.value))}
              onCompositionEnd={(e: any) => setBranchName(toUpper(e.target.value))}
              lang="en" inputMode="text"
              className="w-full border border-gray-400 rounded p-2" />
          </div>
        </div>

        <div>
          <label className="text-sm block mb-1 font-medium">계좌번호 (숫자만)</label>
          <input name="account_number" value={accountNumber}
            onChange={(e) => setAccountNumber(toNum(e.target.value))}
            onCompositionEnd={(e: any) => setAccountNumber(toNum(e.target.value))}
            inputMode="numeric"
            className="w-full border border-gray-400 rounded p-2" />
        </div>

        <div>
          <label className="text-sm block mb-1 font-medium">휴대폰번호</label>
          <PhoneInput name="phone" defaultValue={i?.phone ?? ''} />
        </div>

        {/* 주소 - 정산정보 안에 포함 */}
        <div className="pt-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">주소 (일본)</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm block mb-1 font-medium">우편번호 (숫자만)</label>
              <input name="postal_code" value={postalCode}
                onChange={(e) => setPostalCode(toNum(e.target.value))}
                onCompositionEnd={(e: any) => setPostalCode(toNum(e.target.value))}
                inputMode="numeric"
                className="w-full border border-gray-400 rounded p-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm block mb-1 font-medium">도도부현</label>
                <input name="prefecture" defaultValue={i?.prefecture ?? ''}
                  className="w-full border border-gray-400 rounded p-2" />
              </div>
              <div>
                <label className="text-sm block mb-1 font-medium">시/구</label>
                <input name="city" defaultValue={i?.city ?? ''}
                  className="w-full border border-gray-400 rounded p-2" />
              </div>
            </div>
            <div>
              <label className="text-sm block mb-1 font-medium">도로명/건물번호</label>
              <input name="street" defaultValue={i?.street ?? ''}
                className="w-full border border-gray-400 rounded p-2" />
            </div>
          </div>
        </div>
      </div>

      {/* 연락 상태 */}
      <div>
        <label className="text-sm block mb-1 font-medium">연락 상태</label>
        <select name="contact_status" defaultValue={i?.contact_status ?? 'active'}
          className="w-full border border-gray-400 rounded p-2 max-w-xs">
          <option value="active">연락 가능</option>
          <option value="inactive">연락 불가</option>
          <option value="blocked">탈락</option>
        </select>
      </div>

      <SubmitButton>저장</SubmitButton>
    </form>
  );
}