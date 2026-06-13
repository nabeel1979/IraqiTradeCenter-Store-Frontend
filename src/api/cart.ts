import client from './client';
import type { CartItem } from '@/types';

export interface CartState {
  revision: number;
  epoch: number;
  items: CartItem[];
}

export const cartApi = {
  get: async (): Promise<CartState> => {
    const res = await client.get<CartState>('/api/store/cart');
    return res.data;
  },

  sync: async (items: CartItem[], clientRevision?: number): Promise<{ revision: number; epoch?: number }> => {
    const res = await client.put<{ revision: number }>('/api/store/cart', {
      clientRevision,
      items,
    });
    return res.data;
  },

  clear: async (): Promise<{ revision: number; epoch?: number }> => {
    const res = await client.delete<{ revision: number }>('/api/store/cart');
    return res.data;
  },
};
