import { Link, useLocation, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { companiesApi } from '@/api/companies';
import { User, ShoppingBag, Building2, LogOut, Wallet, Receipt, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccountFiltersProvider, AccountFilterBar, type AccountCompanyOption } from './accountFilters';

/** المسارات التي تستفيد من شريط الفلترة (شركة + تواريخ) */
const FILTERED_ROUTES = ['/account/wallet', '/account/statement', '/account/orders'];

export function AccountPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: cards } = useQuery({
    queryKey: ['my-cards'],
    queryFn: companiesApi.myCards,
    enabled: !!user,
  });

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  if (!user) return <Navigate to="/auth/login" replace />;

  const companies: AccountCompanyOption[] = (cards ?? []).map((c) => ({
    companyCode: c.companyCode,
    companyName: c.companyName,
  }));

  const tabs = [
    { to: '/account', label: t('myAccount'), icon: User, exact: true },
    { to: '/account/wallet', label: t('wallet'), icon: Wallet },
    { to: '/account/statement', label: t('accountStatement'), icon: Receipt },
    { to: '/account/orders', label: t('orderStatus'), icon: ShoppingBag },
    { to: '/account/cards', label: t('myCompanies'), icon: Building2 },
    { to: '/account/link', label: t('linkCompany'), icon: Link2 },
  ];

  const showFilters = FILTERED_ROUTES.includes(location.pathname);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="card mb-4 flex items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/30 sm:h-14 sm:w-14">
            <User className="h-6 w-6 text-brand-600 sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-gray-900 dark:text-white">{user.fullName}</p>
            <p className="truncate text-sm text-gray-500">{user.phone}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="hidden text-xs text-gray-400 sm:inline">{t('userCode')}:</span>
              <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-bold text-brand-600 dark:bg-gray-800">
                {user.userCode}
              </code>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title={t('logout')}
          aria-label={t('logout')}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-red-900/40 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
          <span className="hidden sm:inline">{t('logout')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 dark:bg-gray-800 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const active = tab.exact
            ? location.pathname === tab.to
            : location.pathname === tab.to || location.pathname.startsWith(tab.to + '/');
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                active
                  ? 'bg-white text-brand-600 shadow dark:bg-gray-700 dark:text-brand-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400',
              )}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className={cn('whitespace-nowrap', active ? 'inline' : 'hidden sm:inline')}>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      <AccountFiltersProvider companies={companies}>
        {showFilters && <AccountFilterBar />}
        <Outlet />
      </AccountFiltersProvider>
    </div>
  );
}
