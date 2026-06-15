import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from './Navbar';
import { useAuthStore } from '@/store/authStore';
import { useCartSync } from '@/hooks/useCartSync';

export function Layout() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const { user, token } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  useCartSync();

  useEffect(() => {
    if (!token || !user || user.isProfileCompleted !== false) return;
    const allowed = ['/auth/complete-profile', '/auth/verify', '/auth/register', '/auth/login'];
    if (!allowed.some((p) => location.pathname.startsWith(p))) {
      navigate('/auth/complete-profile', { replace: true });
    }
  }, [token, user, location.pathname, navigate]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface dark:bg-gray-950">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4">
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-gray-200/80 bg-surface-card py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
        <p>{t('footerRights', { year })}</p>
      </footer>
    </div>
  );
}
