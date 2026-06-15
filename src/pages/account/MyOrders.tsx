import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, ChevronDown, ChevronUp, Eye, Building2, X, FileText } from 'lucide-react';
import { ordersApi } from '@/api/orders';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { formatAmount, formatDate, formatNumber } from '@/lib/utils';
import { useAccountFilters } from './accountFilters';
import { StatementDocumentModal } from './StatementDocumentModal';
import type { Order, OrderSourceType, StatementLine } from '@/types';

function statusVariant(status: string): 'warning' | 'info' | 'success' | 'danger' | 'default' {
  const map: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'default'> = {
    Pending: 'warning',
    Received: 'info',
    InProcessing: 'info',
    InvoiceIssued: 'success',
    Shipping: 'info',
    Delivered: 'success',
    Rejected: 'danger',
    Issued: 'success',
    PartiallyPaid: 'warning',
    Paid: 'success',
  };
  return map[status] ?? 'default';
}

function orderKey(order: Order) {
  const src: OrderSourceType = order.sourceType ?? 'Order';
  return `${src}-${order.companyCode}-${order.id}`;
}

function OrderItemsTable({ order }: { order: Order }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const currency = order.currency ?? 'IQD';

  return (
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
          {order.items.map((item, i) => {
            const unitLabel = isAr
              ? (item.unitOfMeasureName ?? '')
              : (item.unitOfMeasureNameEn || item.unitOfMeasureName || '');
            const lineTotal = item.quantity * item.unitPrice;
            return (
              <tr key={i}>
                <td className="items-grid-cell px-3 py-2.5">
                  <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                  {unitLabel && <p className="text-xs text-gray-400">{unitLabel}</p>}
                </td>
                <td className="items-grid-cell px-2 py-2.5 text-center text-gray-600">
                  <span className="num-display">{formatNumber(item.quantity)}</span>
                </td>
                <td className="items-grid-cell px-2 py-2.5 text-end text-gray-600">
                  <span className="num-display">{formatAmount(item.unitPrice, currency)}</span>
                </td>
                <td className="items-grid-cell px-2 py-2.5 text-end font-semibold text-gray-900 dark:text-white">
                  <span className="num-display">{formatAmount(lineTotal, currency)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="items-grid-cell px-3 py-2.5 text-end text-sm font-medium text-gray-600">
              {t('total')}
            </td>
            <td className="items-grid-cell px-2 py-2.5 text-end font-bold text-brand-600">
              <span className="num-display">{formatAmount(order.totalAmount, currency)}</span>
              <span className="ms-1 text-xs font-normal text-gray-400">{currency}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function MyOrders() {
  const { t } = useTranslation();
  const { companyCode, from, to } = useAccountFilters();
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [invoiceDoc, setInvoiceDoc] = useState<StatementLine | null>(null);

  useEffect(() => { setPage(1); }, [companyCode, from, to]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page, companyCode, from, to],
    queryFn: () => ordersApi.myOrders({ pageNumber: page, pageSize: 10, companyCode, from, to }),
  });

  const openDetails = (order: Order) => {
    const src = order.sourceType ?? 'Order';
    if (src === 'Invoice') {
      setInvoiceDoc({
        date: order.createdAt,
        companyCode: order.companyCode,
        companyName: order.companyName,
        docType: 'Invoice',
        docId: Number(order.id),
        docNumber: order.orderNumber,
        currency: order.currency ?? 'IQD',
        debit: order.totalAmount,
        credit: 0,
        balance: 0,
      });
      setViewOrder(null);
    } else {
      setViewOrder(order);
      setInvoiceDoc(null);
    }
    setExpanded(orderKey(order));
  };

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;

  if (!data?.items.length) return <EmptyState icon={ShoppingBag} title={t('noOrders')} />;

  return (
    <>
      <div className="space-y-3">
        {data.items.map((order) => {
          const key = orderKey(order);
          const isOpen = expanded === key;
          const isInvoice = (order.sourceType ?? 'Order') === 'Invoice';
          const currency = order.currency ?? 'IQD';

          return (
            <div key={key} className="card overflow-hidden">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      #{order.orderNumber}
                    </p>
                    <Badge variant={statusVariant(order.status)}>
                      {t(`status.${order.status}` as never)}
                    </Badge>
                    {isInvoice && (
                      <Badge variant="default">
                        <FileText className="me-1 h-3 w-3" />
                        {t('centralInvoice')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {order.companyName}
                    </span>
                    <span>·</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="font-bold text-brand-600 num-display">
                    {formatAmount(order.totalAmount, currency)}
                    <span className="ms-1 text-xs font-normal text-gray-400">{currency}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openDetails(order)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {isInvoice ? t('openInvoice') : t('viewOrder')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : key)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700"
                      aria-label={isOpen ? 'collapse' : 'expand'}
                    >
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-gray-100 p-4 dark:border-gray-800">
                  {order.notes && (
                    <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{t('orderNotes')}: </span>
                      {order.notes}
                    </p>
                  )}
                  {order.items.length > 0 ? (
                    <OrderItemsTable order={order} />
                  ) : (
                    <p className="text-sm text-gray-500">{t('loading')}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {data.totalCount > 10 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline px-4 py-2 text-sm">
              {t('prev')}
            </button>
            <span className="text-sm text-gray-600">{t('pageOf', { current: page })}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * 10 >= data.totalCount} className="btn-outline px-4 py-2 text-sm">
              {t('next')}
            </button>
          </div>
        )}
      </div>

      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setViewOrder(null)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('orderDetails')}</h2>
                <p className="text-sm text-gray-500">#{viewOrder.orderNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewOrder(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(viewOrder.status)}>
                  {t(`status.${viewOrder.status}` as never)}
                </Badge>
                <span className="text-sm text-gray-500">{viewOrder.companyName}</span>
                <span className="text-sm text-gray-400">· {formatDate(viewOrder.createdAt)}</span>
              </div>

              {viewOrder.notes && (
                <div className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800/60">
                  <p className="mb-1 text-xs font-medium text-gray-500">{t('orderNotes')}</p>
                  <p className="text-gray-700 dark:text-gray-300">{viewOrder.notes}</p>
                </div>
              )}

              <OrderItemsTable order={viewOrder} />
            </div>
          </div>
        </div>
      )}

      {invoiceDoc && (
        <StatementDocumentModal line={invoiceDoc} onClose={() => setInvoiceDoc(null)} />
      )}
    </>
  );
}
