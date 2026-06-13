import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';
import { cartApi } from '@/api/cart';
import { useAuthStore } from '@/store/authStore';
import { CART_PERSIST_KEY, LEGACY_CART_STORAGE_KEYS, rememberCartEpoch } from '@/lib/cartCache';

const sameLine = (a: CartItem, productId: number, companyCode: string, unitId: number) =>
  a.productId === productId && a.companyCode === companyCode && a.unitOfMeasureId === unitId;

let syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSync(items: CartItem[], revision: number) {
  const token = useAuthStore.getState().token;
  if (!token) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    cartApi.sync(items, revision).then((res) => {
      useCartStore.setState({ revision: res.revision, epoch: res.epoch ?? useCartStore.getState().epoch });
      if (res.epoch) rememberCartEpoch(res.epoch);
    }).catch(() => {});
  }, 600);
}

interface CartStore {
  items: CartItem[];
  revision: number;
  epoch: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, companyCode: string, unitId: number) => void;
  updateQuantity: (productId: number, companyCode: string, unitId: number, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  applyServerState: (items: CartItem[], revision: number, epoch?: number) => void;
  resetLocalCart: () => void;
}

// إزالة مفاتيح السلة القديمة من localStorage
for (const key of LEGACY_CART_STORAGE_KEYS) {
  localStorage.removeItem(key);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      revision: 0,
      epoch: 0,

      resetLocalCart: () => set({ items: [], revision: 0 }),

      applyServerState: (items, revision, epoch) => {
        set({ items, revision, epoch: epoch ?? get().epoch });
        if (epoch) rememberCartEpoch(epoch);
      },

      addItem: (item) => {
        const existing = get().items.find((i) =>
          sameLine(i, item.productId, item.companyCode, item.unitOfMeasureId),
        );
        let next: CartItem[];
        if (existing) {
          next = get().items.map((i) =>
            sameLine(i, item.productId, item.companyCode, item.unitOfMeasureId)
              ? { ...i, quantity: i.quantity + item.quantity }
              : i,
          );
        } else {
          next = [...get().items, item];
        }
        set({ items: next });
        scheduleSync(next, get().revision);
      },

      removeItem: (productId, companyCode, unitId) => {
        const next = get().items.filter((i) => !sameLine(i, productId, companyCode, unitId));
        set({ items: next });
        scheduleSync(next, get().revision);
      },

      updateQuantity: (productId, companyCode, unitId, qty) => {
        const next = get().items.map((i) =>
          sameLine(i, productId, companyCode, unitId) ? { ...i, quantity: qty } : i,
        );
        set({ items: next });
        scheduleSync(next, get().revision);
      },

      clearCart: () => {
        set({ items: [] });
        const token = useAuthStore.getState().token;
        if (token) {
          cartApi.clear().then((res) => {
            useCartStore.setState({ revision: res.revision, epoch: res.epoch ?? useCartStore.getState().epoch });
            if (res.epoch) rememberCartEpoch(res.epoch);
          }).catch(() => {});
        }
      },

      total: () => get().items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0),
    }),
    {
      name: CART_PERSIST_KEY,
      partialize: (s) => ({ items: s.items, revision: s.revision, epoch: s.epoch }),
    },
  ),
);

export async function pullCartFromServer() {
  const token = useAuthStore.getState().token;
  if (!token) return;
  try {
    const res = await cartApi.get();
    const state = useCartStore.getState();
    const epochChanged = res.epoch > state.epoch;
    const revisionChanged = res.revision > state.revision;
    if (epochChanged || revisionChanged) {
      useCartStore.getState().applyServerState(res.items, res.revision, res.epoch);
    }
  } catch {
    // غير مسجّل أو الشبكة
  }
}
