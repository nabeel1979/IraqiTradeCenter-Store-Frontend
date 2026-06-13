import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { ordersApi } from '@/api/orders';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAccountFilters } from './accountFilters';

function statusVariant(status: string): 'warning' | 'info' | 'success' | 'danger' | 'default' {
  const map: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'default'> = {
    Pending: 'warning',
    Received: 'info',
    InProcessing: 'info',
    InvoiceIssued: 'success',
    Shipping: 'info',
    Delivered: 'success',
    Rejected: 'danger',
  };
  return map[status] ?? 'default';
}

export function MyOrders() {
  const { t } = useTranslation();
  const { companyCode, from, to } = useAccountFilters();
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  // إعادة التصفّح للصفحة الأولى عند تغيير الفلاتر
  useEffect(() => { setPage(1); }, [companyCode, from, to]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page, companyCode, from, to],
    queryFn: () => ordersApi.myOrders({ pageNumber: page, pageSize: 10, companyCode, from, to }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;

  if (!data?.items.length) return <EmptyState icon={ShoppingBag} title={t('noOrders')} />;

  return (
    <div className="space-y-3">
      {data.items.map((order) => (
        <div key={order.id} className="card overflow-hidden">
          <div
            className="flex cursor-pointer items-center justify-between p-4"
            onClick={() => setExpanded(expanded === order.id ? null : order.id)}
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  #{order.orderNumber}
                </p>
                <Badge variant={statusVariant(order.status)}>
                  {t(`status.${order.status}` as never)}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {order.companyName} · {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-brand-600">{formatCurrency(order.totalAmount)}</span>
              {expanded === order.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </div>
          </div>

          {expanded === order.id && (
            <div className="border-t border-gray-100 dark:border-gray-800 p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500">
                    <th className="text-start pb-2">المنتج</th>
                    <th className="text-center pb-2">{t('quantity')}</th>
                    <th className="text-end pb-2">{t('price')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2">
                        <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                        <p className="text-xs text-gray-400">{item.unitOfMeasureName}</p>
                      </td>
                      <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-2 text-end font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {data.totalCount > 10 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline px-4 py-2 text-sm">
            السابق
          </button>
          <span className="text-sm text-gray-600">صفحة {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * 10 >= data.totalCount} className="btn-outline px-4 py-2 text-sm">
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
