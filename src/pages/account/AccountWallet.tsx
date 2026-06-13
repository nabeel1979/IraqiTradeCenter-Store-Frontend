import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Wallet, Building2, ArrowDownCircle, ArrowUpCircle, Scale } from 'lucide-react';
import { companiesApi } from '@/api/companies';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useAccountFilters } from './accountFilters';

export function AccountWallet() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? 'ar-IQ' : 'en-US';
  const { companyCode, from, to } = useAccountFilters();

  const { data: financials, isLoading } = useQuery({
    queryKey: ['my-financials'],
    queryFn: companiesApi.financials,
  });

  const { data: statement } = useQuery({
    queryKey: ['my-statement', companyCode, from, to],
    queryFn: () => companiesApi.statement({ companyCode, from, to }),
  });

  const rows = useMemo(
    () => (financials ?? []).filter((f) => !companyCode || f.companyCode === companyCode),
    [financials, companyCode],
  );

  const totals = useMemo(() => {
    const owed = rows.reduce((s, r) => s + r.currentBalance, 0);
    const limit = rows.reduce((s, r) => s + r.creditLimit, 0);
    const hasLimit = rows.some((r) => r.creditLimit > 0);
    const available = hasLimit ? limit - owed : null;
    return { owed, limit, available };
  }, [rows]);

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;

  if (!rows.length) {
    return <EmptyState icon={Wallet} title={t('noCards')} description={t('noCardsHint')} />;
  }

  return (
    <div className="space-y-4">
      {/* Hero summary */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-brand-400 p-5 text-white">
          <div className="flex items-center gap-2 opacity-90">
            <Wallet className="h-5 w-5" />
            <span className="text-sm font-medium">{t('wallet')}</span>
          </div>
          <p className="mt-3 text-xs opacity-80">{t('totalOwed')}</p>
          <p className="num-display mt-1 text-3xl font-extrabold">{formatCurrency(totals.owed)}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
              <p className="text-[11px] opacity-80">{t('creditLimit')}</p>
              <p className="num-display mt-0.5 font-bold">
                {totals.limit > 0 ? formatCurrency(totals.limit) : t('unlimited')}
              </p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
              <p className="text-[11px] opacity-80">{t('availableCredit')}</p>
              <p className="num-display mt-0.5 font-bold">
                {totals.available != null ? formatCurrency(totals.available) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Period activity (date-aware) */}
      {statement && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/20">
              <ArrowUpCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">{t('periodInvoiced')}</p>
              <p className="num-display truncate font-bold text-gray-900 dark:text-white">
                {formatCurrency(statement.totalDebit)}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20">
              <ArrowDownCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">{t('periodPaid')}</p>
              <p className="num-display truncate font-bold text-gray-900 dark:text-white">
                {formatCurrency(statement.totalCredit)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Per-company breakdown */}
      <div className="space-y-2">
        <h3 className="px-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('byCompany')}</h3>
        {rows.map((r) => {
          const owedPositive = r.currentBalance > 0;
          return (
            <div key={r.companyCode} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">{r.companyName}</p>
                    {r.lastActivity && (
                      <p className="text-[11px] text-gray-400">
                        {t('lastActivity')}: {formatDate(r.lastActivity, locale)}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={r.isActive ? 'success' : 'danger'}>
                  {r.isActive ? t('active') : t('inactive')}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/60">
                  <p className="text-[11px] text-gray-500">{t('currentBalance')}</p>
                  <p className={cn('num-display text-sm font-bold', owedPositive ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
                    {formatCurrency(Math.abs(r.currentBalance))}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/60">
                  <p className="text-[11px] text-gray-500">{t('creditLimit')}</p>
                  <p className="num-display text-sm font-bold text-gray-900 dark:text-white">
                    {r.creditLimit > 0 ? formatCurrency(r.creditLimit) : t('unlimited')}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/60">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500">
                    <Scale className="h-3 w-3" />
                    {t('availableCredit')}
                  </div>
                  <p className="num-display text-sm font-bold text-gray-900 dark:text-white">
                    {r.availableCredit != null ? formatCurrency(r.availableCredit) : '—'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
