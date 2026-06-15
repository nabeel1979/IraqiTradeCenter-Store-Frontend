import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, User, Globe, Sun, Moon, Menu, X, LogIn, LogOut, LayoutGrid, Maximize, Minimize } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { getMainStoreUrl } from '@/lib/storeUrl';
import { clearCompanyCode } from '@/hooks/useCompany';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useCompanyStore } from '@/store/companyStore';
import { cn } from '@/lib/utils';
import i18n from '@/i18n';
import { useFullscreen } from '@/hooks/useFullscreen';

const LOGO_SRC = '/logo.png?v=5';

const iconBtn =
  'rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800';

export function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { companyInfo, companyCode } = useCompanyStore();
  const cartCount = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('itc-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem('itc-theme');
    if (saved === 'dark') setDark(true);
  }, []);

  const toggleLang = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next).then(() => {
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = next;
      document.title = i18n.t('siteTitle');
    });
  };

  const navLinks = [
    { to: '/', label: t('home') },
    { to: '/products', label: t('products') },
    { to: '/companies', label: t('companies') },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-brand-200/50 bg-surface-card/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:h-16 sm:px-4 md:h-[4.5rem]">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src={LOGO_SRC}
            alt={t('siteName')}
            className="h-8 w-8 shrink-0 object-contain sm:h-10 sm:w-10 md:h-11 md:w-11 lg:h-12 lg:w-12"
            draggable={false}
          />
          <Link to="/" className="hidden min-[400px]:block">
            <p className="text-sm font-bold leading-tight text-brand-800 sm:text-base dark:text-white">
              {companyInfo?.name ?? t('siteName')}
            </p>
            <p className="text-xs text-brand-600">{t('storeLabel')}</p>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.filter(l => !companyCode || l.to !== '/companies').map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                location.pathname === l.to
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {companyCode && (
            <a
              href={getMainStoreUrl('/companies')}
              title={t('allCompanies')}
              onClick={() => clearCompanyCode()}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <LayoutGrid className="h-5 w-5" />
            </a>
          )}

          {/* Cart */}
          <Link to="/cart" className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white num-display">
                {formatNumber(cartCount)}
              </span>
            )}
          </Link>

          {/* Lang */}
          <button onClick={toggleLang} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
            <Globe className="h-5 w-5" />
          </button>

          {/* Theme */}
          <button onClick={() => setDark(!dark)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Fullscreen — desktop only (not useful on mobile/PWA) */}
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
            aria-label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
            className="hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:inline-flex dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>

          {/* User / auth */}
          {user ? (
            <div className="flex items-center gap-0.5">
              {/* Mobile: account icon */}
              <Link
                to="/account"
                title={t('account')}
                aria-label={t('account')}
                className={cn(iconBtn, 'md:hidden')}
              >
                <User className="h-5 w-5" />
              </Link>
              {/* Desktop: name + account */}
              <Link
                to="/account"
                className="hidden items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 md:flex"
              >
                <User className="h-4 w-4" />
                {user.fullName.split(' ')[0]}
              </Link>
              <button
                type="button"
                onClick={() => { logout(); navigate('/auth/login'); }}
                title={t('logout')}
                aria-label={t('logout')}
                className={cn(
                  iconBtn,
                  'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400',
                )}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              {/* Mobile: login icon */}
              <Link
                to="/auth/login"
                title={t('login')}
                aria-label={t('login')}
                className={cn(iconBtn, 'md:hidden')}
              >
                <LogIn className="h-5 w-5" />
              </Link>
              {/* Desktop: login button */}
              <Link to="/auth/login" className="btn-primary hidden text-xs px-3 py-2 md:inline-flex">
                {t('login')}
              </Link>
            </>
          )}

          {/* Mobile menu */}
          <button className="rounded-lg p-2 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950 md:hidden">
          {navLinks.filter(l => !companyCode || l.to !== '/companies').map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block rounded-lg px-3 py-2.5 text-sm font-medium',
                location.pathname === l.to
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-700 dark:text-gray-300',
              )}
            >
              {l.label}
            </Link>
          ))}
          {companyCode && (
            <a
              href={getMainStoreUrl('/companies')}
              onClick={() => { clearCompanyCode(); setMobileOpen(false); }}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('allCompanies')}
            </a>
          )}
          {user && (
            <Link to="/account" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('account')}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
