import { getCountryByIso } from './countries';

const TZ_TO_ISO: Record<string, string> = {
  'Asia/Baghdad': 'IQ',
  'Asia/Kuwait': 'KW',
  'Asia/Riyadh': 'SA',
  'Asia/Dubai': 'AE',
  'Asia/Qatar': 'QA',
  'Asia/Bahrain': 'BH',
  'Asia/Muscat': 'OM',
  'Asia/Amman': 'JO',
  'Asia/Beirut': 'LB',
  'Asia/Damascus': 'SY',
  'Asia/Gaza': 'PS',
  'Asia/Hebron': 'PS',
  'Africa/Cairo': 'EG',
  'Africa/Tripoli': 'LY',
  'Africa/Khartoum': 'SD',
  'Africa/Casablanca': 'MA',
  'Africa/Algiers': 'DZ',
  'Africa/Tunis': 'TN',
  'Europe/Istanbul': 'TR',
  'Asia/Tehran': 'IR',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'Europe/London': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Asia/Kolkata': 'IN',
  'Asia/Karachi': 'PK',
};

export function detectDefaultCountryIso(): string {
  // المنطقة الزمنية أدق للموقع الفعلي من لغة الواجهة (مثل en-US الشائعة عالمياً).
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TZ_TO_ISO[tz]) return TZ_TO_ISO[tz];
  } catch {
    /* ignore */
  }

  // لغة الواجهة تُستخدم فقط إذا كانت تحمل بلداً عربياً/خليجياً صريحاً (ليس US/GB العامة).
  if (typeof navigator !== 'undefined') {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const lang of langs) {
      const match = lang.match(/[-_]([A-Za-z]{2})$/);
      if (match) {
        const iso = match[1].toUpperCase();
        if (REGIONAL_LOCALE_ISOS.has(iso) && getCountryByIso(iso)) return iso;
      }
    }
  }

  // الافتراضي: العراق (منصّة عراقية).
  return 'IQ';
}

/** دول نثق بها من لغة الواجهة (إقليمية) — نتجنّب US/GB العامة التي لا تعكس الموقع. */
const REGIONAL_LOCALE_ISOS = new Set<string>([
  'IQ', 'KW', 'SA', 'AE', 'QA', 'BH', 'OM', 'JO', 'LB', 'SY', 'PS', 'EG', 'LY', 'SD', 'MA', 'DZ', 'TN', 'YE',
]);
