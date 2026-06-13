import type { Product, ProductUnit } from '@/types';

/** معرّف ثابت للوحدة عندما لا يُرجعه الـ API (ديناميكي حسب الشركة + اسم الوحدة). */
function resolveUnitId(companyCode: string, unitName: string, apiId?: number): number {
  if (apiId && apiId > 0) return apiId;
  let h = 0;
  const s = `${companyCode}:${unitName}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

/** عملة المادة من حقول الـ API المحتملة — افتراضياً IQD. */
function resolveCurrency(raw: Record<string, unknown>): string {
  const c =
    raw.currencyCode ?? raw.currency ?? raw.salesCurrency ?? raw.priceCurrency;
  if (typeof c === 'string' && c.trim()) return c.trim().toUpperCase();
  return 'IQD';
}

/** وحدات إضافية من وصف المادة (مثل: كارتون 12 قطعة) عندما لا يُرجعها الـ API. */
function deriveExtraUnits(
  base: ProductUnit,
  description: string | undefined,
  sellingPrice: number,
  currency: string,
  companyCode: string,
): ProductUnit[] {
  if (!description?.trim()) return [];
  const extras: ProductUnit[] = [];
  const patterns = [
    /كارتون\D{0,24}(\d+)\s*قطعة/i,
    /احتواء\s*الكارتون\s*(\d+)\s*قطعة/i,
    /(\d+)\s*قطعة\s*(?:في|بال)?\s*الكارتون/i,
  ];
  let packSize = 0;
  for (const p of patterns) {
    const m = description.match(p);
    if (m?.[1]) { packSize = parseInt(m[1], 10); break; }
  }
  const baseIsPiece = /قطعة/i.test(base.name) || /piece/i.test(base.nameEn ?? '');
  if (packSize > 1 && baseIsPiece) {
    extras.push({
      unitId: resolveUnitId(companyCode, 'كارتون'),
      name: 'كارتون',
      nameEn: 'Carton',
      price: sellingPrice * packSize,
      factorToBase: packSize,
      currency,
    });
  }
  return extras;
}

function mapUnit(raw: Record<string, unknown>, companyCode: string, fallbackCurrency: string): ProductUnit | null {
  const unitId = Number(raw.unitId ?? raw.id ?? 0);
  const name = String(raw.name ?? raw.unitName ?? '').trim();
  if (!name) return null;
  const price = Number(raw.price ?? raw.salesPrice ?? 0);
  return {
    unitId: resolveUnitId(companyCode, name, unitId),
    name,
    nameEn: raw.nameEn ? String(raw.nameEn) : raw.unitNameEn ? String(raw.unitNameEn) : undefined,
    price,
    factorToBase: Number(raw.factorToBase ?? 1) || 1,
    currency: raw.currency ? String(raw.currency).toUpperCase() : fallbackCurrency,
  };
}

/** يُطبّع استجابة المنتج من أي شركة ديناميكياً. */
export function mapStoreProduct(raw: Product & Record<string, unknown>): Product {
  const companyCode = String(raw.companyCode ?? '').toUpperCase();
  const currency = resolveCurrency(raw);
  const baseUnitName = String(raw.unitOfMeasureName ?? 'وحدة');
  const baseUnitId = resolveUnitId(companyCode, baseUnitName, Number(raw.unitOfMeasureId ?? 0));

  let units: ProductUnit[] = [];
  if (Array.isArray(raw.units) && raw.units.length > 0) {
    units = (raw.units as unknown[])
      .map((u) => mapUnit(u as Record<string, unknown>, companyCode, currency))
      .filter((u): u is ProductUnit => u !== null);
  }

  if (units.length === 0) {
    units = [{
      unitId: baseUnitId,
      name: baseUnitName,
      nameEn: raw.unitOfMeasureNameEn ? String(raw.unitOfMeasureNameEn) : undefined,
      price: Number(raw.sellingPrice ?? 0),
      factorToBase: 1,
      currency,
    }];
  }

  // إثراء الوحدات من الوصف عندما يُرجع الـ API وحدة واحدة فقط
  if (units.length === 1) {
    const extras = deriveExtraUnits(
      units[0],
      raw.description ? String(raw.description) : undefined,
      Number(raw.sellingPrice ?? 0),
      currency,
      companyCode,
    );
    for (const ex of extras) {
      if (!units.some((u) => u.unitId === ex.unitId)) units.push(ex);
    }
  }

  return {
    ...raw,
    companyCode,
    unitOfMeasureId: baseUnitId,
    currency,
    units,
  };
}

