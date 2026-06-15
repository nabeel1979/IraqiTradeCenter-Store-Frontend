/** المخزون المتاح بوحدة القياس المختارة = المخزون الأساسي ÷ معامل الوحدة. */
export function stockInSelectedUnit(baseStock: number, factorToBase = 1): number {
  const factor = factorToBase > 0 ? factorToBase : 1;
  return Math.floor(baseStock / factor);
}
