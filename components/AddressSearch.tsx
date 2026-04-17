'use client';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/provider';

declare global {
  interface Window { daum: any; }
}

type Props = {
  defaultPostal?: string;
  defaultRegion?: string;
  defaultDistrict?: string;
  defaultRoad?: string;
  defaultDetail?: string;
};

export default function AddressSearch({
  defaultPostal = '', defaultRegion = '', defaultDistrict = '',
  defaultRoad = '', defaultDetail = '',
}: Props) {
  const { t } = useI18n();
  const [postal, setPostal] = useState(defaultPostal);
  const [region, setRegion] = useState(defaultRegion);
  const [district, setDistrict] = useState(defaultDistrict);
  const [road, setRoad] = useState(defaultRoad);
  const [detail, setDetail] = useState(defaultDetail);

  useEffect(() => {
    if (document.getElementById('daum-postcode')) return;
    const script = document.createElement('script');
    script.id = 'daum-postcode';
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    document.body.appendChild(script);
  }, []);

  function openSearch() {
    if (!window.daum?.Postcode) {
      alert(t('address.loading'));
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        setPostal(data.zonecode);
        setRegion(data.sido);
        setDistrict(data.sigungu);
        setRoad(data.roadAddress.replace(`${data.sido} ${data.sigungu} `, ''));
      },
    }).open();
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="postal_code" value={postal} />
      <input type="hidden" name="region" value={region} />
      <input type="hidden" name="district" value={district} />
      <input type="hidden" name="road_address" value={road} />

      <div className="flex gap-2">
        <input value={postal} readOnly placeholder={t('address.postal')}
          className="border border-gray-400 rounded p-2 w-32 bg-gray-50" />
        <button type="button" onClick={openSearch}
          className="bg-gray-200 hover:bg-gray-300 px-4 rounded text-sm">
          {t('address.search')}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input value={region} readOnly placeholder={t('address.region')}
          className="border border-gray-400 rounded p-2 bg-gray-50" />
        <input value={district} readOnly placeholder={t('address.district')}
          className="border border-gray-400 rounded p-2 bg-gray-50" />
      </div>
      <input value={road} readOnly placeholder={t('address.road')}
        className="w-full border border-gray-400 rounded p-2 bg-gray-50" />
      <input name="building_detail" value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder={t('address.detail')}
        className="w-full border border-gray-400 rounded p-2" />
    </div>
  );
}
