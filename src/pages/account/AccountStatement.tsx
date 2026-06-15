import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Receipt, FileText, Banknote, MoreVertical, ExternalLink } from 'lucide-react';
import { companiesApi } from '@/api/companies';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatAmount, formatDate, cn } from '@/lib/utils';
import { useAccountFilters } from './accountFilters';
import { StatementDocumentModal } from './StatementDocumentModal';
import type { StatementCurrencyBlock, StatementLine } from '@/types';

function displayBalance(balance: number) {
  // من منظور العميل: الرصيد الموجب = مدين (مستحق عليه)
  return balance;
}

function SummaryCard({
  label,
  amount,
  currency,
  tone,
}: {
  label: string;
  amount: number;
  currency: string;
  tone?: 'debit' | 'credit' | 'balance';
}) {
  return (
    <div className="card p-3">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{currency}</p>
      <p
        className={cn(
          'num-display mt-0.5 truncate text-lg font-bold',
          tone === 'debit' && 'text-rose-600 dark:text-rose-400',
          tone === 'credit' && 'text-emerald-600 dark:text-emerald-400',
          (!tone || tone === 'balance') && 'text-gray-900 dark:text-white',
        )}
      >
        {formatAmount(amount, currency)}
      </p>
    </div>
  );
}

function ActionsMenu({
  line,
  onOpen,
}: {
  line: StatementLine;
  onOpen: (line: StatementLine) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        aria-label={t('actions')}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute end-0 z-10 mt-1 min-w-[10rem] rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            onClick={() => {
              setOpen(false);
              onOpen(line);
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {line.docType === 'Invoice' ? t('openInvoice') : t('openReceipt')}
          </button>
        </div>
      )}
    </div>
  );
}

function CurrencyBlockTable({
  block,
  showCompanyCol,
  locale,
  onOpenDoc,
}: {
  block: StatementCurrencyBlock;
  showCompanyCol: boolean;
  locale: string;
  onOpenDoc: (line: StatementLine) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="rounded-lg bg-brand-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
          {block.currency}
        </span>
        <span className="text-xs text-gray-400">{t('statementCurrencyBlock')}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label={t('openingBalance')} amount={block.openingBalance} currency={block.currency} />
        <SummaryCard label={t('periodInvoiced')} amount={block.totalDebit} currency={block.currency} tone="debit" />
        <SummaryCard label={t('periodPaid')} amount={block.totalCredit} currency={block.currency} tone="credit" />
        <SummaryCard label={t('closingBalance')} amount={block.closingBalance} currency={block.currency} tone="balance" />
      </div>

      {!block.lines.length ? (
        <p className="px-1 text-sm text-gray-500">{t('noStatementMovements')}</p>
      ) : (
        <>
          <div className="card hidden overflow-x-auto sm:block">
            <table className="statement-grid-table w-full min-w-[42rem] table-fixed border-collapse text-sm">
              <colgroup>
                <col style={{ width: '7.5rem' }} />
                {showCompanyCol && <col style={{ width: '8.5rem' }} />}
                <col />
                <col style={{ width: '5.75rem' }} />
                <col style={{ width: '5.75rem' }} />
                <col style={{ width: '5.75rem' }} />
                <col style={{ width: '3rem' }} />
              </colgroup>
              <thead>
                <tr className="bg-gray-50/80 text-xs text-gray-500 dark:bg-gray-800/40">
                  <th className="statement-grid-cell px-3 py-2.5 text-start font-medium">{t('date')}</th>
                  {showCompanyCol && (
                    <th className="statement-grid-cell px-3 py-2.5 text-start font-medium">{t('company')}</th>
                  )}
                  <th className="statement-grid-cell px-3 py-2.5 text-start font-medium">{t('document')}</th>
                  <th className="statement-grid-cell px-3 py-2.5 text-end font-medium">{t('debitCustomer')}</th>
                  <th className="statement-grid-cell px-3 py-2.5 text-end font-medium">{t('creditCustomer')}</th>
                  <th className="statement-grid-cell px-3 py-2.5 text-end font-medium">{t('balance')}</th>
                  <th className="statement-grid-cell px-1 py-2.5" aria-label={t('actions')} />
                </tr>
              </thead>
              <tbody>
                {block.lines.map((l) => (
                  <tr key={`${l.companyCode}-${l.docType}-${l.docId}`} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="statement-grid-cell whitespace-nowrap px-3 py-2.5 text-gray-600 dark:text-gray-300">
                      {formatDate(l.date, locale)}
                    </td>
                    {showCompanyCol && (
                      <td className="statement-grid-cell truncate px-3 py-2.5 text-gray-600 dark:text-gray-300">
                        {l.companyName}
                      </td>
                    )}
                    <td className="statement-grid-cell px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        {l.docType === 'Invoice' ? (
                          <FileText className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                        ) : (
                          <Banknote className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        )}
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{l.docNumber}</span>
                      </span>
                    </td>
                    <td className="statement-grid-cell px-3 py-2.5 text-end text-rose-600 dark:text-rose-400">
                      <span className="num-display">{l.debit ? formatAmount(l.debit, block.currency) : '—'}</span>
                    </td>
                    <td className="statement-grid-cell px-3 py-2.5 text-end text-emerald-600 dark:text-emerald-400">
                      <span className="num-display">{l.credit ? formatAmount(l.credit, block.currency) : '—'}</span>
                    </td>
                    <td className={cn(
                      'statement-grid-cell px-3 py-2.5 text-end font-semibold',
                      displayBalance(l.balance) >= 0
                        ? 'text-gray-900 dark:text-white'
                        : 'text-emerald-600 dark:text-emerald-400',
                    )}>
                      <span className="num-display">{formatAmount(displayBalance(l.balance), block.currency)}</span>
                    </td>
                    <td className="statement-grid-cell px-1 py-2 text-center">
                      <ActionsMenu line={l} onOpen={onOpenDoc} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 sm:hidden">
            {block.lines.map((l) => (
              <div key={`${l.companyCode}-${l.docType}-${l.docId}`} className="card p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    {l.docType === 'Invoice' ? (
                      <FileText className="h-4 w-4 shrink-0 text-rose-500" />
                    ) : (
                      <Banknote className="h-4 w-4 shrink-0 text-emerald-500" />
                    )}
                    <span className="truncate font-mono text-xs font-semibold">{l.docNumber}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatDate(l.date, locale)}</span>
                    <ActionsMenu line={l} onOpen={onOpenDoc} />
                  </div>
                </div>
                {showCompanyCol && <p className="mt-1 truncate text-xs text-gray-500">{l.companyName}</p>}
                <div className="mt-2 flex items-center justify-between text-sm">
                  <div className="flex gap-3">
                    {l.debit > 0 && (
                      <span className="num-display text-rose-600">{formatAmount(l.debit, block.currency)}</span>
                    )}
                    {l.credit > 0 && (
                      <span className="num-display text-emerald-600">{formatAmount(l.credit, block.currency)}</span>
                    )}
                  </div>
                  <span className="num-display font-semibold text-gray-900 dark:text-white">
                    {formatAmount(displayBalance(l.balance), block.currency)}
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

export function AccountStatement() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? 'ar-IQ' : 'en-US';
  const { companyCode, from, to } = useAccountFilters();
  const [docLine, setDocLine] = useState<StatementLine | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-statement-full', companyCode, from, to],
    queryFn: () => companiesApi.statement({ companyCode, from, to }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;

  const showCompanyCol = !companyCode;
  const hasAnyLines = (data?.blocks ?? []).some((b) => b.lines.length > 0);
  const hasAnyBlock = (data?.blocks ?? []).length > 0;

  if (!hasAnyBlock || !hasAnyLines) {
    return <EmptyState icon={Receipt} title={t('noStatementData')} />;
  }

  return (
    <>
      <div className="space-y-8">
        {(data?.blocks ?? []).map((block) => (
          <CurrencyBlockTable
            key={block.currency}
            block={block}
            showCompanyCol={showCompanyCol}
            locale={locale}
            onOpenDoc={setDocLine}
          />
        ))}
      </div>

      {docLine && (
        <StatementDocumentModal line={docLine} onClose={() => setDocLine(null)} />
      )}
    </>
  );
}
