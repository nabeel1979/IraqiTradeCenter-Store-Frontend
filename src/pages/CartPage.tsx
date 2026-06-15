import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ShoppingCart, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useCompanyStore } from '@/store/companyStore';
import { useCartStock } from '@/hooks/useCartStock';
import { ordersApi } from '@/api/orders';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatNumber } from '@/lib/utils';
import { AmountCurrency, LineCalcDisplay } from '@/components/ui/AmountCurrency';

export function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { companyCode: fixedCompanyCode } = useCompanyStore();
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore();
  const { getMaxQuantity, isLoading: stockLoading } = useCartStock(items);
  const adjustedRef = useRef(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState<{ orderNumber: string }[]>([]);

  // Group items by company
  const byCompany = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.companyCode]) acc[item.companyCode] = [];
    acc[item.companyCode].push(item);
    return acc;
  }, {});

  const companies = Object.keys(byCompany);

  const currencyTotals = items.reduce<Record<string, number>>((acc, i) => {
    const c = i.currency ?? 'IQD';
    acc[c] = (acc[c] ?? 0) + i.quantity * i.unitPrice;
    return acc;
  }, {});
  const singleCurrency = Object.keys(currencyTotals).length === 1 ? Object.keys(currencyTotals)[0] : null;

  const hasStockIssue = items.some((item) => {
    const max = getMaxQuantity(item);
    return max !== null && (max <= 0 || item.quantity > max);
  });

  useEffect(() => {
    if (stockLoading || adjustedRef.current) return;
    let changed = false;
    for (const item of items) {
      const max = getMaxQuantity(item);
      if (max !== null && max > 0 && item.quantity > max) {
        updateQuantity(item.productId, item.companyCode, item.unitOfMeasureId, max);
        toast.info(t('quantityAdjusted', { name: item.productName, max: formatNumber(max) }));
        changed = true;
      }
    }
    if (changed) adjustedRef.current = true;
  }, [stockLoading, items, getMaxQuantity, updateQuantity, t]);

  const handleQuantityChange = (
    item: (typeof items)[number],
    nextQty: number,
  ) => {
    const max = getMaxQuantity(item);
    if (max !== null && nextQty > max) {
      toast.error(t('exceedsStock', { max: formatNumber(max) }));
      return;
    }
    updateQuantity(item.productId, item.companyCode, item.unitOfMeasureId, nextQty);
  };

  const handlePlaceOrder = async () => {
    if (!user) { navigate('/auth/login'); return; }
    if (!items.length) return;
    if (hasStockIssue) {
      toast.error(t('cannotPlaceOrderStock'));
      return;
    }

    setLoading(true);
    const results: { orderNumber: string }[] = [];
    try {
      for (const companyCode of companies) {
        const companyItems = byCompany[companyCode];
        const res = await ordersApi.place({
          companyCode,
          items: companyItems.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            unitOfMeasureId: i.unitOfMeasureId,
          })),
          notes,
        });
        results.push({ orderNumber: res.orderNumber });
      }
      clearCart();
      setPlaced(results);
      toast.success(t('orderPlaced'));
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data;
      const msg = data?.message ?? data?.errors?.[0];
      toast.error(msg ?? t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (placed.length > 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{t('orderPlaced')}</h2>
        <div className="mb-6 space-y-2">
          {placed.map((o) => (
            <p key={o.orderNumber} className="text-sm text-gray-600">
              {t('orderNumber')}: <span className="font-semibold text-brand-600">#{o.orderNumber}</span>
            </p>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <Link to="/account/orders" className="btn-primary">{t('myOrders')}</Link>
          <Link to="/products" className="btn-outline">{t('products')}</Link>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title={t('emptyCart')}
        action={<Link to="/products" className="btn-primary">{t('products')}</Link>}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">{t('yourCart')}</h1>

      {companies.length > 1 && !fixedCompanyCode && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {t('multiCompanyWarning')}
        </div>
      )}

      {hasStockIssue && !stockLoading && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {t('cannotPlaceOrderStock')}
        </div>
      )}

      <div className="space-y-4 mb-6">
        {companies.map((code) => (
          <div key={code} className="card p-4">
            <p className="mb-3 text-sm font-bold text-gray-700 dark:text-gray-300 border-b pb-2 dark:border-gray-700">
              {byCompany[code][0].companyName}
            </p>
            <div className="space-y-3">
              {byCompany[code].map((item) => {
                const maxQty = getMaxQuantity(item);
                const atMax = maxQty !== null && item.quantity >= maxQty;
                const overStock = maxQty !== null && item.quantity > maxQty;
                return (
                <div key={`${item.productId}-${item.companyCode}-${item.unitOfMeasureId}`} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName}</p>
                    <p className="text-xs text-gray-500">{item.unitOfMeasureName}</p>
                    {maxQty !== null && (
                      <p className={`text-xs ${maxQty <= 0 ? 'text-red-500' : overStock ? 'text-red-500' : 'text-gray-400'}`}>
                        {maxQty <= 0
                          ? t('outOfStock')
                          : <>{t('stock')}: <span className="num-display">{formatNumber(maxQty)}</span></>}
                        {overStock && maxQty > 0 && (
                          <span className="ms-1">— {t('cartStockExceeded')}</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(item, Math.max(1, item.quantity - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border text-sm"
                    >−</button>
                    <span className="w-8 text-center text-sm font-semibold num-display">{formatNumber(item.quantity)}</span>
                    <button
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      disabled={atMax || maxQty === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >+</button>
                  </div>
                  <div className="min-w-[8rem] text-end text-sm font-bold text-brand-600">
                    <LineCalcDisplay
                      qty={item.quantity}
                      unitPrice={item.unitPrice}
                      currency={item.currency ?? 'IQD'}
                    />
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.companyCode, item.unitOfMeasureId)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );})}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="card p-4 mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('notes')}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="input resize-none"
          placeholder={t('notesPlaceholder')}
        />
      </div>

      {/* Total */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900 dark:text-white">{t('total')}</span>
          {singleCurrency ? (
            <AmountCurrency
              amount={total()}
              currency={singleCurrency}
              amountClassName="text-xl font-extrabold text-brand-600"
              currencyClassName="text-sm text-brand-500"
            />
          ) : (
            <div className="space-y-1 text-end">
              {Object.entries(currencyTotals).map(([ccy, amt]) => (
                <AmountCurrency key={ccy} amount={amt} currency={ccy} amountClassName="text-sm font-bold text-brand-600" />
              ))}
            </div>
          )}
        </div>
      </div>

      {!user ? (
        <div className="text-center">
          <p className="mb-3 text-sm text-gray-500">{t('loginRequired')}</p>
          <Link to="/auth/login" className="btn-primary">{t('login')}</Link>
        </div>
      ) : (
        <button onClick={handlePlaceOrder} disabled={loading || hasStockIssue || stockLoading} className="btn-primary w-full">
          {loading ? t('loading') : t('placeOrder')}
        </button>
      )}
    </div>
  );
}
