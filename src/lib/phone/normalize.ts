/** يوحّد رقم الهاتف لطلبات API المتجر (9647XXXXXXXXX). */
export function normalizePhoneForApi(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('9647') && digits.length === 13) return digits;
  if (digits.startsWith('07') && digits.length === 11) return `964${digits.slice(1)}`;
  if (digits.startsWith('7') && digits.length === 10) return `964${digits}`;
  return digits;
}
