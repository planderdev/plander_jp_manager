import { createAdminClient } from '@/lib/supabase/admin';

export type BriefScheduleData = {
  id: number;
  scheduledAt: string;
  influencerHandle: string;
  clientName: string;
  storeNameJa: string;
  addressKo: string;
  addressJa: string;
  businessHours: string;
  providedMenu: string;
  additionalRequests: string;
};

const GUIDE_SECTIONS = {
  visit: [
    '1. ご予約時間の厳守をお願いいたします。時間変更がある場合は、遅くともご来店日の1日前までにご連絡をお願いいたします。',
    '2. 同行されるご友人がいらっしゃる場合は、Googleマップにて★5の高評価レビューを訪問当日にご投稿いただけますと幸いです。',
    '3. ご来店後7日以内に動画の初稿をご提出いただき、内容修正にもご協力をお願いいたします。店舗側の確認後、修正点がある場合はお伝えし、最終確認が完了次第アップロードをお願いいたします。なお、最終動画の投稿はご来店日から14日以内にお願いいたします。',
    '4. アップロード後の削除はご遠慮ください。',
    '5. 投稿は日本国内からお願いいたします。',
  ],
  publish: 'ご来店後14日以内に投稿',
  post: '投稿時は関連するテーマと結びつけること（例：韓国旅行、韓国グルメ など）',
  shoot: [
    '1. 店舗入口、店舗内の全景撮影',
    '2. 店舗メニュー表またはテーブルオーダーの撮影（日本語翻訳メニューを強調）',
    '3. 広告っぽくない自然な雰囲気での撮影',
    '4. ご自身のアカウントの雰囲気に合わせて自由に撮影していただきつつ、お店の魅力がしっかり伝わるようお願いいたします。',
  ],
};

export function getGuideSections() {
  return GUIDE_SECTIONS;
}

export async function getBriefScheduleData(scheduleId: number): Promise<BriefScheduleData | null> {
  const sb = createAdminClient();
  const { data } = await sb
    .from('schedules')
    .select(`
      id,
      scheduled_at,
      provided_menu,
      additional_requests,
      clients (
        company_name,
        store_name_ja,
        postal_code,
        region,
        district,
        road_address,
        building_detail,
        address_ja,
        business_hours,
        provided_menu
      ),
      influencers (
        handle
      )
    `)
    .eq('id', scheduleId)
    .single();

  if (!data) return null;

  const client = Array.isArray(data.clients) ? data.clients[0] : data.clients;
  const influencer = Array.isArray(data.influencers) ? data.influencers[0] : data.influencers;
  const addressKo = [
    client?.postal_code ? `(${client.postal_code})` : null,
    client?.region,
    client?.district,
    client?.road_address,
    client?.building_detail,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    id: data.id,
    scheduledAt: data.scheduled_at,
    influencerHandle: influencer?.handle ?? 'sample_creator',
    clientName: client?.company_name ?? '-',
    storeNameJa: client?.store_name_ja ?? client?.company_name ?? '-',
    addressKo: addressKo || '-',
    addressJa: client?.address_ja ?? '-',
    businessHours: client?.business_hours ?? '-',
    providedMenu: data.provided_menu ?? client?.provided_menu ?? '-',
    additionalRequests: data.additional_requests ?? '',
  };
}

export function formatInviteDate(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hour}:${minute}`;
}
