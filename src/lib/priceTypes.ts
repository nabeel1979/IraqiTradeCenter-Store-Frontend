/** أنواع أسعار البيع — تطابق ItemPriceType في النظام. */
export const SALE_PRICE_TYPES = [
  { value: 4, labelAr: 'سعر المفرد', labelEn: 'Retail' },
  { value: 5, labelAr: 'سعر خاص', labelEn: 'Special' },
  { value: 3, labelAr: 'سعر جملة', labelEn: 'Wholesale' },
  { value: 6, labelAr: 'سعر تصدير', labelEn: 'Export' },
] as const;

export function salesPriceTypeLabel(type: number | null | undefined, lang: string): string {
  if (!type) return lang === 'ar' ? 'سعر المفرد' : 'Retail';
  const row = SALE_PRICE_TYPES.find((p) => p.value === type);
  if (!row) return String(type);
  return lang === 'ar' ? row.labelAr : row.labelEn;
}
