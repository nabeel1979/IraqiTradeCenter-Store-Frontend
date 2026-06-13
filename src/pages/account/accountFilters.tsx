import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, CalendarRange, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccountCompanyOption {
  companyCode: string;
  companyName: string;
}

interface AccountFiltersValue {
  companyCode: string | null; // null = all companies
  from: string; // '' = open start
  to: string; // '' = today
  setCompanyCode: (c: string | null) => void;
  setFrom: (d: string) => void;
  setTo: (d: string) => void;
  reset: () => void;
  companies: AccountCompanyOption[];
}

const AccountFiltersContext = createContext<AccountFiltersValue | null>(null);

export function AccountFiltersProvider({
  companies,
  children,
}: {
  companies: AccountCompanyOption[];
  children: ReactNode;
}) {
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const value = useMemo<AccountFiltersValue>(
    () => ({
      companyCode,
      from,
      to,
      setCompanyCode,
      setFrom,
      setTo,
      reset: () => {
        setCompanyCode(null);
        setFrom('');
        setTo('');
      },
      companies,
    }),
    [companyCode, from, to, companies],
  );

  return <AccountFiltersContext.Provider value={value}>{children}</AccountFiltersContext.Provider>;
}

export function useAccountFilters(): AccountFiltersValue {
  const ctx = useContext(AccountFiltersContext);
  if (!ctx) throw new Error('useAccountFilters must be used within AccountFiltersProvider');
  return ctx;
}

/** أدوات تواريخ مساعدة (ISO yyyy-mm-dd بالتوقيت المحلي) */
function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type PresetKey = 'all' | 'month' | 'days30' | 'year';

/**
 * شريط فلترة موحّد: اختيار الشركة + نطاق التواريخ مع اختصارات.
 * مصمّم للموبايل أولاً (يتكدّس عمودياً على الشاشات الصغيرة).
 */
export function AccountFilterBar() {
  const { t } = useTranslation();
  const { companyCode, from, to, setCompanyCode, setFrom, setTo, reset, companies } = useAccountFilters();

  const applyPreset = (key: PresetKey) => {
    const today = new Date();
    if (key === 'all') {
      setFrom('');
      setTo('');
      return;
    }
    let start: Date;
    if (key === 'month') start = new Date(today.getFullYear(), today.getMonth(), 1);
    else if (key === 'days30') start = new Date(today.getTime() - 29 * 86400000);
    else start = new Date(today.getFullYear(), 0, 1);
    setFrom(isoLocal(start));
    setTo(isoLocal(today));
  };

  const hasFilters = !!companyCode || !!from || !!to;

  const presets: { key: PresetKey; label: string }[] = [
    { key: 'all', label: t('filters.all') },
    { key: 'month', label: t('filters.thisMonth') },
    { key: 'days30', label: t('filters.last30') },
    { key: 'year', label: t('filters.thisYear') },
  ];

  return (
    <div className="card mb-4 p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Company selector */}
        <div className="relative min-w-0 sm:max-w-xs sm:flex-1">
          <Building2 className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ltr:left-3 rtl:right-3" />
          <select
            value={companyCode ?? ''}
            onChange={(e) => setCompanyCode(e.target.value || null)}
            className="input w-full appearance-none ltr:pl-9 rtl:pr-9"
          >
            <option value="">{t('filters.allCompanies')}</option>
            {companies.map((c) => (
              <option key={c.companyCode} value={c.companyCode}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-gray-400">
            <CalendarRange className="h-4 w-4" />
          </div>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input w-[8.5rem] py-1.5 text-sm"
            aria-label={t('filters.from')}
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input w-[8.5rem] py-1.5 text-sm"
            aria-label={t('filters.to')}
          />
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              title={t('filters.clear')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Presets */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const active =
            (p.key === 'all' && !from && !to) ||
            (p.key !== 'all' && !!from && !!to && isPresetActive(p.key, from, to));
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.key)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400',
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function isPresetActive(key: PresetKey, from: string, to: string): boolean {
  const today = new Date();
  const todayIso = isoLocal(today);
  if (to !== todayIso) return false;
  if (key === 'month') return from === isoLocal(new Date(today.getFullYear(), today.getMonth(), 1));
  if (key === 'days30') return from === isoLocal(new Date(today.getTime() - 29 * 86400000));
  if (key === 'year') return from === isoLocal(new Date(today.getFullYear(), 0, 1));
  return false;
}
