import client from './client';
import { mapStoreProduct } from '@/lib/productMapper';
import { isProductPurchasable } from '@/lib/productAvailability';
import type { Product, PagedResult } from '@/types';

export interface ProductsQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  companyCode?: string;
  categoryId?: number;
}

export const productsApi = {
  list: (params: ProductsQuery = {}) =>
    client.get<PagedResult<Product>>('/capi/store/products', { params }).then((r) => {
      const items = r.data.items
        .map((p) => mapStoreProduct(p as Product & Record<string, unknown>))
        .filter(isProductPurchasable);
      return { ...r.data, items };
    }),

  get: (companyCode: string, id: number) =>
    client
      .get<Product>(`/capi/store/products/${companyCode}/${id}`)
      .then((r) => mapStoreProduct(r.data as Product & Record<string, unknown>)),
};
