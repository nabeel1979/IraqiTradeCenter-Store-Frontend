import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App';
import i18n from './i18n';
import './index.css';
import { ensureCartCacheFresh } from '@/lib/cartCache';
import { useCartStore } from '@/store/cartStore';

document.documentElement.classList.add('theme-company-store');

void ensureCartCacheFresh().then((flushed) => {
  if (flushed) useCartStore.getState().resetLocalCart();
});

i18n.on('languageChanged', () => {
  const lng = i18n.language;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  document.title = i18n.t('siteTitle');
});
document.title = i18n.t('siteTitle');
document.documentElement.lang = i18n.language;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
