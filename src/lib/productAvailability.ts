import { stockInSelectedUnit } from '@/lib/stockUtils';
import type { Product, ProductUnit } from '@/types';

const SALE_FALLBACK = [4, 5, 3, 6] as const;

export function resolveUnitSalePrice(
  salePrices: Partial<Record<number, number>> | undefined,
  customerPriceType: number | null | undefined,
  fallbackPrice: number,
): number {
  if (!salePrices || Object.keys(salePrices).length === 0) return fallbackPrice;
  const preferred = customerPriceType ?? 4;
  const direct = salePrices[preferred];
  if (direct != null && direct > 0) return direct;
  for (const t of SALE_FALLBACK) {
    const v = salePrices[t];
    if (v != null && v > 0) return v;
  }
  return fallbackPrice;
}

function fallbackUnits(product: Product): ProductUnit[] {
  if (product.units && product.units.length > 0) return product.units;
  return [{
    unitId: product.unitOfMeasureId,
    name: product.unitOfMeasureName,
    nameEn: product.unitOfMeasureNameEn,
    price: product.sellingPrice,
    factorToBase: 1,
    currency: product.currency ?? 'IQD',
  }];
}

/** يُطبّق سعر العميل على وحدات المنتج ويُحدّث السعر الظاهر. */
export function applyCustomerPrices(product: Product, customerPriceType?: number | null): Product {
  const units = fallbackUnits(product).map((u) => ({
    ...u,
    price: resolveUnitSalePrice(u.salePrices, customerPriceType, u.price),
  }));
  const next: Product = { ...product, units };
  const display = getDefaultPurchasableUnit(next);
  if (!display) return next;
  return {
    ...next,
    sellingPrice: display.price,
    unitOfMeasureId: display.unitId,
    unitOfMeasureName: display.name,
    unitOfMeasureNameEn: display.nameEn,
  };
}

export function getUnitStock(product: Product, unit: ProductUnit): number {
  return stockInSelectedUnit(product.currentStock, unit.factorToBase);
}

export function hasRetailPrice(unit: ProductUnit): boolean {
  if (unit.salePrices?.[4] != null && unit.salePrices[4]! > 0) return true;
  return unit.factorToBase === 1 && unit.price > 0;
}

/** المنتج يظهر في المتجر فقط إذا وُجد سعر مفرد على وحدة واحدة على الأقل. */
export function isProductVisibleInStore(product: Product): boolean {
  return fallbackUnits(product).some(hasRetailPrice);
}

export function isUnitPurchasable(product: Product, unit: ProductUnit): boolean {
  return unit.price > 0 && getUnitStock(product, unit) >= 1;
}

export function getPurchasableUnits(product: Product): ProductUnit[] {
  return fallbackUnits(product).filter((u) => isUnitPurchasable(product, u));
}

export function isProductPurchasable(product: Product): boolean {
  return isProductVisibleInStore(product) && getPurchasableUnits(product).length > 0;
}

export function getDefaultPurchasableUnit(product: Product): ProductUnit | null {
  const units = getPurchasableUnits(product);
  if (!units.length) return null;
  return units.reduce((best, u) => (u.factorToBase < best.factorToBase ? u : best));
}
