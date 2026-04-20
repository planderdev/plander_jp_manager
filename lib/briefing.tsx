import { createAdminClient } from '@/lib/supabase/admin';
import { getClientBriefConfig, splitGuideLines } from '@/lib/briefing-config';

export type BriefScheduleData = {
  id: number;
  scheduledAt: string;
  clientId: number;
  influencerHandle: string;
  clientName: string;
  storeNameJa: string;
  addressKo: string;
  addressJa: string;
  businessHours: string;
  providedMenu: string;
  additionalRequests: string;
  visitNoticeTime: string;
  guideSections: {
    visit: string[];
    publish: string;
    post: string;
    shoot: string[];
  };
};

export async function getBriefScheduleData(scheduleId: number): Promise<BriefScheduleData | null> {
  const sb = createAdminClient();
  const { data } = await sb
    .from('schedules')
    .select(`
      id,
      client_id,
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
  const clientBriefConfig = await getClientBriefConfig(data.client_id);
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
    clientId: data.client_id,
    scheduledAt: data.scheduled_at,
    influencerHandle: influencer?.handle ?? 'sample_creator',
    clientName: client?.company_name ?? '-',
    storeNameJa: client?.store_name_ja ?? client?.company_name ?? '-',
    addressKo: addressKo || '-',
    addressJa: client?.address_ja ?? '-',
    businessHours: client?.business_hours ?? '-',
    providedMenu: data.provided_menu ?? client?.provided_menu ?? '-',
    additionalRequests: data.additional_requests ?? '',
    visitNoticeTime: clientBriefConfig.visitNoticeTime,
    guideSections: {
      visit: splitGuideLines(clientBriefConfig.visitNotesJa),
      publish: clientBriefConfig.publishNotesJa,
      post: clientBriefConfig.postNotesJa,
      shoot: splitGuideLines(clientBriefConfig.shootNotesJa),
    },
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
