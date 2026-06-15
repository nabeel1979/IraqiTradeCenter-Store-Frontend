import { useCallback, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { productsApi } from '@/api/products';
import { stockInSelectedUnit } from '@/lib/stockUtils';
import type { CartItem } from '@/types';

export function useCartStock(items: CartItem[]) {
  const productKeys = useMemo(() => {
    const seen = new Set<string>();
    return items.reduce<{ companyCode: string; productId: number }[]>((acc, item) => {
      const key = `${item.companyCode}:${item.productId}`;
      if (seen.has(key)) return acc;
      seen.add(key);
      acc.push({ companyCode: item.companyCode, productId: item.productId });
      return acc;
    }, []);
  }, [items]);

  const queries = useQueries({
    queries: productKeys.map((k) => ({
      queryKey: ['product', k.companyCode, k.productId],
      queryFn: () => productsApi.get(k.companyCode, k.productId),
      staleTime: 30_000,
    })),
  });

  const productMap = useMemo(() => {
    const map = new Map<string, Awaited<ReturnType<typeof productsApi.get>>>();
    productKeys.forEach((k, i) => {
      if (queries[i]?.data) map.set(`${k.companyCode}:${k.productId}`, queries[i].data!);
    });
    return map;
  }, [productKeys, queries]);

  const getMaxQuantity = useCallback(
    (item: CartItem): number | null => {
      const product = productMap.get(`${item.companyCode}:${item.productId}`);
      if (!product) return null;
      const unit = product.units?.find((u) => u.unitId === item.unitOfMeasureId);
      const factor = unit?.factorToBase ?? 1;
      return stockInSelectedUnit(product.currentStock, factor);
    },
    [productMap],
  );

  const isLoading = queries.some((q) => q.isLoading);

  return { getMaxQuantity, isLoading };
}
