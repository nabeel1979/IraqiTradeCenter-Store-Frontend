import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/api/companies';
import { useAuthStore } from '@/store/authStore';

/** خريطة companyCode → نوع سعر العميل (ItemPriceType). */
export function useCustomerPriceMap() {
  const token = useAuthStore((s) => s.token);
  const { data } = useQuery({
    queryKey: ['my-financials'],
    queryFn: companiesApi.financials,
    enabled: !!token,
  });

  return useMemo(() => {
    const map = new Map<string, number | null>();
    for (const f of data ?? []) {
      map.set(f.companyCode.toUpperCase(), f.salesPriceType ?? null);
    }
    return map;
  }, [data]);
}
