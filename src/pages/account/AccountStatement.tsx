import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Receipt, FileText, Banknote } from 'lucide-react';
import { companiesApi } from '@/api/companies';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useAccountFilters } from './accountFilters';

export function AccountStatement() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? 'ar-IQ' : 'en-US';
  const { companyCode, from, to } = useAccountFilters();

  const { data, isLoading } = useQuery({
    queryKey: ['my-statement-full', companyCode, from, to],
    queryFn: () => companiesApi.statement({ companyCode, from, to }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;

  const showCompanyCol = !companyCode;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label={t('openingBalance')} value={formatCurrency(data?.openingBalance ?? 0)} />
        <SummaryCard label={t('periodInvoiced')} value={formatCurrency(data?.totalDebit ?? 0)} tone="debit" />
        <SummaryCard label={t('periodPaid')} value={formatCurrency(data?.totalCredit ?? 0)} tone="credit" />
        <SummaryCard label={t('closingBalance')} value={formatCurrency(data?.closingBalance ?? 0)} tone="balance" />
      </div>

      {!data?.lines.length ? (
        <EmptyState icon={Receipt} title={t('noStatementData')} />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="card hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 dark:border-gray-800">
                  <th className="px-4 py-3 text-start">{t('date')}</th>
                  {showCompanyCol && <th className="px-4 py-3 text-start">{t('company')}</th>}
                  <th className="px-4 py-3 text-start">{t('document')}</th>
                  <th className="px-4 py-3 text-end">{t('debit')}</th>
                  <th className="px-4 py-3 text-end">{t('credit')}</th>
                  <th className="px-4 py-3 text-end">{t('balance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {data.lines.map((l, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="whitespace-nowrap px-4 py-2.5 text-gray-600 dark:text-gray-300">
                      {formatDate(l.date, locale)}
                    </td>
                    {showCompanyCol && (
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{l.companyName}</td>
                    )}
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        {l.docType === 'Invoice' ? (
                          <FileText className="h-3.5 w-3.5 text-rose-500" />
                        ) : (
                          <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{l.docNumber}</span>
                      </span>
                    </td>
                    <td className="num-display px-4 py-2.5 text-end text-rose-600 dark:text-rose-400">
                      {l.debit ? formatCurrency(l.debit) : '—'}
                    </td>
                    <td className="num-display px-4 py-2.5 text-end text-emerald-600 dark:text-emerald-400">
                      {l.credit ? formatCurrency(l.credit) : '—'}
                    </td>
                    <td className="num-display px-4 py-2.5 text-end font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(l.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {data.lines.map((l, i) => (
              <div key={i} className="card p-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5">
                    {l.docType === 'Invoice' ? (
                      <FileText className="h-4 w-4 text-rose-500" />
                    ) : (
                      <Banknote className="h-4 w-4 text-emerald-500" />
                    )}
                    <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">{l.docNumber}</span>
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(l.date, locale)}</span>
                </div>
                {showCompanyCol && <p className="mt-1 truncate text-xs text-gray-500">{l.companyName}</p>}
                <div className="mt-2 flex items-center justify-between text-sm">
                  <div className="flex gap-3">
                    {l.debit > 0 && (
                      <span className="num-display text-rose-600 dark:text-rose-400">+{formatCurrency(l.debit)}</span>
                    )}
                    {l.credit > 0 && (
                      <span className="num-display text-emerald-600 dark:text-emerald-400">-{formatCurrency(l.credit)}</span>
                    )}
                  </div>
                  <span className="num-display font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(l.balance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone?: 'debit' | 'credit' | 'balance' }) {
  return (
    <div className="card p-3">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p
        className={cn(
          'num-display mt-0.5 truncate font-bold',
          tone === 'debit' && 'text-rose-600 dark:text-rose-400',
          tone === 'credit' && 'text-emerald-600 dark:text-emerald-400',
          (!tone || tone === 'balance') && 'text-gray-900 dark:text-white',
        )}
      >
        {value}
      </p>
    </div>
  );
}
