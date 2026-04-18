import type { Locale } from '@/lib/i18n/config';
import { translate } from '@/lib/i18n/config';

export function clientStatusLabel(s: string, locale: Locale = 'ko'): string {
  switch (s) {
    case 'contacted': return translate(locale, 'sales.status.contacted');
    case 'proposed': return translate(locale, 'sales.status.proposed');
    case 'negotiating': return translate(locale, 'sales.status.negotiating');
    case 'active': return translate(locale, 'sales.status.active');
    case 'paused': return translate(locale, 'sales.status.paused');
    case 'ended': return translate(locale, 'sales.status.ended');
    default: return s;
  }
}

export function clientStatusClass(s: string): string {
  switch (s) {
    case 'contacted': return 'bg-blue-100 text-blue-800';
    case 'proposed': return 'bg-purple-100 text-purple-800';
    case 'negotiating': return 'bg-amber-100 text-amber-800';
    case 'active': return 'bg-red-100 text-red-600 font-semibold';
    case 'paused': return 'bg-yellow-100 text-yellow-800';
    case 'ended': return 'bg-gray-200 text-gray-500';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export function isInactiveClient(s: string): boolean {
  return s === 'ended';
}

// 영업 파이프라인 단계 (접촉~진행중)
export function isActivePipeline(s: string): boolean {
  return ['contacted', 'proposed', 'negotiating', 'active'].includes(s);
}

export function contactStatusLabel(s: string, locale: Locale = 'ko'): string {
  switch (s) {
    case 'active': return translate(locale, 'contact.active');
    case 'inactive': return translate(locale, 'contact.inactive');
    case 'blocked': return translate(locale, 'contact.blocked');
    default: return s;
  }
}

export function channelLabel(channel: string, locale: Locale = 'ko'): string {
  switch (channel) {
    case 'instagram': return translate(locale, 'channel.instagram');
    case 'tiktok': return translate(locale, 'channel.tiktok');
    case 'youtube': return translate(locale, 'channel.youtube');
    case 'other': return translate(locale, 'channel.other');
    default: return channel;
  }
}

export function genderLabel(gender: string | null | undefined, locale: Locale = 'ko'): string {
  switch (gender) {
    case 'female': return translate(locale, 'gender.female');
    case 'male': return translate(locale, 'gender.male');
    case 'other': return translate(locale, 'gender.other');
    default: return translate(locale, 'common.none');
  }
}
