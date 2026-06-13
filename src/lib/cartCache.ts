import { platformApi } from '@/api/platform';

export const CART_EPOCH_STORAGE_KEY = 'itc-cart-epoch';
export const LEGACY_CART_STORAGE_KEYS = ['itc-store-cart', 'itc-store-cart-v1'] as const;
export const CART_PERSIST_KEY = 'itc-store-cart-v2';

/** يُستدعى عند فتح المتجر — يفرّغ السلة المحلية إذا تغيّر epoch على السيرفر. */
export async function ensureCartCacheFresh(): Promise<boolean> {
  try {
    const { cartEpoch } = await platformApi.getInfo();
    const stored = Number(localStorage.getItem(CART_EPOCH_STORAGE_KEY) ?? '0');
    if (cartEpoch > stored) {
      purgeLegacyCartStorage();
      localStorage.setItem(CART_EPOCH_STORAGE_KEY, String(cartEpoch));
      return true;
    }
  } catch {
    // شبكة — نكمل بالمحلي
  }
  return false;
}

export function purgeLegacyCartStorage() {
  for (const key of LEGACY_CART_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
  localStorage.removeItem(CART_PERSIST_KEY);
}

export function rememberCartEpoch(epoch: number) {
  localStorage.setItem(CART_EPOCH_STORAGE_KEY, String(epoch));
}
