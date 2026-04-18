import { createAdminClient } from '@/lib/supabase/admin';
import type { ChannelType, Gender, InfluencerApplication } from '@/types/db';

function normalizePlatform(value: string): ChannelType {
  const platform = value.trim().toLowerCase();

  if (platform.includes('insta')) return 'instagram';
  if (platform.includes('tik')) return 'tiktok';
  if (platform.includes('you')) return 'youtube';

  return 'other';
}

function normalizeHandle(rawValue: string, platform: ChannelType) {
  const value = rawValue.trim();

  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    const parts = url.pathname.split('/').filter(Boolean);
    const last = parts.at(-1) ?? '';

    if (platform === 'tiktok' && last.startsWith('@')) {
      return last.slice(1).toLowerCase();
    }

    return last.replace(/^@/, '').toLowerCase();
  } catch {
    return value.replace(/^@/, '').trim().toLowerCase();
  }
}

function buildAccountUrl(channel: ChannelType, handle: string) {
  if (!handle) return null;

  switch (channel) {
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

function normalizeGender(value: string): Gender | null {
  const gender = value.trim().toLowerCase();

  if (!gender) return null;
  if (['female', 'woman', 'women', 'f', '여', '여성', '여자', '女', '女性'].includes(gender)) return 'female';
  if (['male', 'man', 'men', 'm', '남', '남성', '남자', '男', '男性'].includes(gender)) return 'male';

  return 'other';
}

function normalizeAge(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

async function getApplicationOrThrow(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('influencer_applications')
    .select('*')
    .eq('id', id)
    .single<InfluencerApplication>();

  if (error || !data) {
    throw new Error(error?.message ?? '신청자 정보를 찾을 수 없습니다');
  }

  return data;
}

async function updateExistingInfluencer(handle: string, accountUrl: string | null, age: number | null, gender: Gender | null) {
  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from('influencers')
    .select('id, account_url, age, gender')
    .eq('handle', handle)
    .order('id', { ascending: true })
    .limit(1);

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (!existing?.length) {
    return null;
  }

  const current = existing[0];
  const { error: updateError } = await admin
    .from('influencers')
    .update({
      account_url: current.account_url ?? accountUrl,
      age: current.age ?? age,
      gender: current.gender ?? gender,
    })
    .eq('id', current.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return current.id;
}

export async function approveInfluencerApplication(id: string) {
  const application = await getApplicationOrThrow(id);
  const admin = createAdminClient();
  const channel = normalizePlatform(application.platform);
  const handle = normalizeHandle(application.account_id, channel);

  if (!handle) {
    throw new Error('신청자 계정 ID가 비어 있습니다');
  }

  const accountUrl = buildAccountUrl(channel, handle);
  const age = normalizeAge(application.age_group);
  const gender = normalizeGender(application.gender);
  const existingId = await updateExistingInfluencer(handle, accountUrl, age, gender);

  if (!existingId) {
    const { error: insertError } = await admin.from('influencers').insert({
      channel,
      handle,
      followers: 0,
      account_url: accountUrl,
      unit_price: null,
      memo: null,
      name_en: null,
      bank_name: null,
      branch_name: null,
      account_number: null,
      phone: null,
      postal_code: null,
      prefecture: null,
      city: null,
      street: null,
      age,
      gender,
      contact_status: 'active',
    });

    if (insertError) {
      if (insertError.code === '23505') {
        await updateExistingInfluencer(handle, accountUrl, age, gender);
      } else {
        throw new Error(insertError.message);
      }
    }
  }

  const { error: applicationError } = await admin
    .from('influencer_applications')
    .update({ status: 'approved' })
    .eq('id', id);

  if (applicationError) {
    throw new Error(applicationError.message);
  }
}

export async function rejectInfluencerApplication(id: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('influencer_applications')
    .update({ status: 'rejected' })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function restoreInfluencerApplication(id: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('influencer_applications')
    .update({ status: 'pending' })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}
