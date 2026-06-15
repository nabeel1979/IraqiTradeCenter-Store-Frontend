import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X, Printer, FileText, Banknote } from 'lucide-react';
import { companiesApi } from '@/api/companies';
import { Spinner } from '@/components/ui/Spinner';
import { formatAmount, formatDate } from '@/lib/utils';
import type { StatementLine, StatementInvoiceDetail, StatementPaymentDetail } from '@/types';

type Props = {
  line: StatementLine;
  onClose: () => void;
};

export function StatementDocumentModal({ line, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? 'ar-IQ' : 'en-US';
  const isInvoice = line.docType === 'Invoice';

  const invoiceQuery = useQuery({
    queryKey: ['statement-invoice', line.companyCode, line.docId],
    queryFn: () => companiesApi.statementInvoice(line.companyCode, line.docId),
    enabled: isInvoice,
  });

  const paymentQuery = useQuery({
    queryKey: ['statement-payment', line.companyCode, line.docId],
    queryFn: () => companiesApi.statementPayment(line.companyCode, line.docId),
    enabled: !isInvoice,
  });

  const isLoading = isInvoice ? invoiceQuery.isLoading : paymentQuery.isLoading;
  const isError = isInvoice ? invoiceQuery.isError : paymentQuery.isError;
  const invoiceData = invoiceQuery.data as StatementInvoiceDetail | undefined;
  const paymentData = paymentQuery.data as StatementPaymentDetail | undefined;

  const handlePrint = () => window.print();

  const currency = isInvoice
    ? invoiceData?.invoice.currency ?? line.currency
    : paymentData?.currency ?? line.currency;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center print:bg-white print:p-0" onClick={onClose}>
      <div
        className="statement-doc-modal max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-gray-900 print:max-h-none print:max-w-none print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 print:static">
          <div className="flex items-center gap-2">
            {isInvoice ? (
              <FileText className="h-5 w-5 text-rose-500" />
            ) : (
              <Banknote className="h-5 w-5 text-emerald-500" />
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {isInvoice ? t('openInvoice') : t('openReceipt')}
              </h2>
              <p className="font-mono text-sm text-gray-500">{line.docNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              title={t('print')}
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-5">
          {isLoading && (
            <div className="flex justify-center py-10">
              <Spinner className="h-8 w-8" />
            </div>
          )}

          {isError && (
            <p className="py-8 text-center text-sm text-rose-600">{t('error')}</p>
          )}

          {!isLoading && !isError && invoiceData && isInvoice && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
                <span>{invoiceData.invoice.companyName}</span>
                <span>{formatDate(invoiceData.invoice.invoiceDate, locale)}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="items-grid-table w-full min-w-[22rem] table-fixed border-collapse text-sm">
                  <colgroup>
                    <col />
                    <col style={{ width: '4.5rem' }} />
                    <col style={{ width: '5rem' }} />
                    <col style={{ width: '5.5rem' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-50/80 text-xs text-gray-500 dark:bg-gray-800/40">
                      <th className="items-grid-cell px-3 py-2 text-start font-medium">{t('product')}</th>
                      <th className="items-grid-cell px-2 py-2 text-center font-medium">{t('quantity')}</th>
                      <th className="items-grid-cell px-2 py-2 text-end font-medium">{t('price')}</th>
                      <th className="items-grid-cell px-2 py-2 text-end font-medium">{t('lineTotal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.lines.map((item, i) => (
                      <tr key={i}>
                        <td className="items-grid-cell px-3 py-2.5">
                          <p className="font-medium text-gray-900 dark:text-white">{item.itemName}</p>
                          {item.unitName && <p className="text-xs text-gray-400">{item.unitName}</p>}
                        </td>
                        <td className="items-grid-cell px-2 py-2.5 text-center">
                          <span className="num-display">{formatAmount(item.quantity, currency)}</span>
                        </td>
                        <td className="items-grid-cell px-2 py-2.5 text-end">
                          <span className="num-display">{formatAmount(item.unitPrice, currency)}</span>
                        </td>
                        <td className="items-grid-cell px-2 py-2.5 text-end font-semibold">
                          <span className="num-display">{formatAmount(item.lineTotal, currency)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="items-grid-cell px-3 py-2.5 text-end text-sm text-gray-500">{t('total')}</td>
                      <td className="items-grid-cell px-2 py-2.5 text-end font-bold text-brand-600">
                        <span className="num-display">{formatAmount(invoiceData.invoice.totalAmount, currency)}</span>
                        <span className="ms-1 text-xs font-normal text-gray-400">{currency}</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {invoiceData.invoice.notes && (
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                  {invoiceData.invoice.notes}
                </p>
              )}
            </div>
          )}

          {!isLoading && !isError && paymentData && !isInvoice && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>{paymentData.companyName}</span>
                <span>{formatDate(paymentData.paymentDate, locale)}</span>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                <p className="text-xs text-gray-500">{t('amount')}</p>
                <p className="num-display mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatAmount(paymentData.amount, paymentData.currency)}
                  <span className="ms-2 text-sm font-normal text-gray-400">{paymentData.currency}</span>
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-gray-500">{t('paymentMethod')}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{paymentData.paymentMethod}</dd>
                </div>
                {paymentData.invoiceNumber && (
                  <div>
                    <dt className="text-xs text-gray-500">{t('linkedInvoice')}</dt>
                    <dd className="font-mono text-xs text-gray-700 dark:text-gray-300">{paymentData.invoiceNumber}</dd>
                  </div>
                )}
                {paymentData.referenceNumber && (
                  <div className="col-span-2">
                    <dt className="text-xs text-gray-500">{t('referenceNumber')}</dt>
                    <dd className="font-mono text-xs">{paymentData.referenceNumber}</dd>
                  </div>
                )}
              </dl>
              {paymentData.notes && (
                <p className="rounded-lg bg-gray-50 p-3 text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">{paymentData.notes}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
