import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { pullCartFromServer, useCartStore } from '@/store/cartStore';
import { ensureCartCacheFresh } from '@/lib/cartCache';

export function useCartSync() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    void ensureCartCacheFresh().then((flushed) => {
      if (flushed) useCartStore.getState().resetLocalCart();
      if (token) void pullCartFromServer();
    });
  }, []);

  useEffect(() => {
    if (!token) return;

    void pullCartFromServer();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void pullCartFromServer();
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(() => void pullCartFromServer(), 30_000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [token]);
}
