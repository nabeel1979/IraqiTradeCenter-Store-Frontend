export const COUNTRIES = [
  { code: 'IQ', nameAr: 'العراق', nameEn: 'Iraq' },
  { code: 'AE', nameAr: 'الإمارات', nameEn: 'United Arab Emirates' },
  { code: 'SA', nameAr: 'السعودية', nameEn: 'Saudi Arabia' },
  { code: 'KW', nameAr: 'الكويت', nameEn: 'Kuwait' },
  { code: 'JO', nameAr: 'الأردن', nameEn: 'Jordan' },
  { code: 'TR', nameAr: 'تركيا', nameEn: 'Turkey' },
] as const;

export const IRAQ_CITIES = [
  'بغداد',
  'البصرة',
  'نينوى',
  'أربيل',
  'السليمانية',
  'دهوك',
  'كركوك',
  'الأنبار',
  'بابل',
  'كربلاء',
  'النجف',
  'ذي قار',
  'ميسان',
  'واسط',
  'ديالى',
  'صلاح الدين',
  'القادسية',
  'المثنى',
  'الديوانية',
] as const;

export function getCountryLabel(code: string, lang: string): string {
  const c = COUNTRIES.find((x) => x.code === code);
  if (!c) return code;
  return lang === 'ar' ? c.nameAr : c.nameEn;
}

export function getCitiesForCountry(countryCode: string): readonly string[] {
  if (countryCode === 'IQ') return IRAQ_CITIES;
  return [];
}
