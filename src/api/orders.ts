import client from './client';
import type { Order, CartItem, PagedResult } from '@/types';

export interface PlaceOrderPayload {
  companyCode: string;
  items: { productId: number; productName?: string; quantity: number; unitPrice: number; unitOfMeasureId?: number }[];
  notes?: string;
}

export const ordersApi = {
  place: (data: PlaceOrderPayload) =>
    client.post<{ orderId: string; orderNumber: string }>('/api/store/orders', data).then((r) => r.data),

  myOrders: (
    params: {
      pageNumber?: number;
      pageSize?: number;
      companyCode?: string | null;
      from?: string | null;
      to?: string | null;
    } = {},
  ) =>
    client.get<PagedResult<Order>>('/api/store/orders', {
      params: {
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        companyCode: params.companyCode || undefined,
        from: params.from || undefined,
        to: params.to || undefined,
      },
    }).then((r) => r.data),

  get: (id: string) =>
    client.get<Order>(`/api/store/orders/${id}`).then((r) => r.data),
};

export type { CartItem };
