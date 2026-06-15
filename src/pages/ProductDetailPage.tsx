import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Package, ShoppingCart, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { productsApi } from '@/api/products';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui/Spinner';
import { encodeImageUrl, formatNumber } from '@/lib/utils';
import { AmountCurrency, LineCalcDisplay } from '@/components/ui/AmountCurrency';
import { useMemo, useState, useEffect, useRef } from 'react';
import i18n from '@/i18n';
import type { ProductUnit } from '@/types';
import { getPurchasableUnits, getUnitStock, applyCustomerPrices } from '@/lib/productAvailability';
import { useCustomerPriceMap } from '@/hooks/useCustomerPriceMap';

export function ProductDetailPage() {
  const { companyCode, id } = useParams<{ companyCode: string; id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const authed = !!useAuthStore((s) => s.token);
  const priceMap = useCustomerPriceMap();
  const [qty, setQty] = useState(1);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const isRtl = i18n.language === 'ar';
  const isAr = i18n.language === 'ar';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', companyCode, id, authed],
    queryFn: () => productsApi.get(companyCode!, Number(id)),
    enabled: !!companyCode && !!id,
  });

  const pricedProduct = useMemo(
    () => (product && companyCode ? applyCustomerPrices(product, priceMap.get(companyCode.toUpperCase())) : product),
    [product, companyCode, priceMap],
  );

  // قائمة الوحدات القابلة للشراء فقط.
  const units = useMemo<ProductUnit[]>(() => {
    if (!pricedProduct) return [];
    return getPurchasableUnits(pricedProduct);
  }, [pricedProduct]);

  useEffect(() => {
    if (units.length && unitId !== null && !units.some((u) => u.unitId === unitId)) {
      setUnitId(null);
      setQty(1);
    }
  }, [units, unitId]);

  const selectedUnit = units.find((u) => u.unitId === unitId) ?? units[0];

  // ألبوم صور المنتج: حتى 5 صور كحدّ أقصى.
  const gallery = useMemo<string[]>(() => {
    if (product?.images && product.images.length > 0) return product.images.slice(0, 5);
    if (product?.imageUrl) return [product.imageUrl];
    return [];
  }, [product]);

  const galleryLen = gallery.length;
  const safeActive = galleryLen ? Math.min(activeImg, galleryLen - 1) : 0;

  const goTo = (i: number) => {
    if (galleryLen <= 1) return;
    setActiveImg(((i % galleryLen) + galleryLen) % galleryLen);
  };
  const goNext = () => goTo(safeActive + 1);
  const goPrev = () => goTo(safeActive - 1);

  // تصفّح بالسحب على شاشات اللمس (iOS / Android).
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    // في الواجهة العربية يكون اتجاه السحب معكوساً.
    const forward = isRtl ? dx > 0 : dx < 0;
    forward ? goNext() : goPrev();
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner className="h-10 w-10" /></div>;
  }

  if (!pricedProduct || !selectedUnit) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-gray-500">
        {t('outOfStock')}
      </div>
    );
  }

  const stockInUnit = getUnitStock(pricedProduct, selectedUnit);
  const unitLabel = (u: ProductUnit) => (isAr ? u.name : (u.nameEn || u.name));

  const handleAdd = () => {
    const existing = useCartStore.getState().items.find(
      (i) => i.productId === pricedProduct.id && i.companyCode === pricedProduct.companyCode && i.unitOfMeasureId === selectedUnit.unitId,
    );
    const inCart = existing?.quantity ?? 0;
    if (inCart + qty > stockInUnit) {
      toast.error(t('exceedsStock', { max: formatNumber(Math.max(0, stockInUnit - inCart)) }));
      return;
    }
    addItem({
      productId: pricedProduct.id,
      productName: pricedProduct.name,
      companyCode: pricedProduct.companyCode,
      companyName: pricedProduct.companyName,
      unitOfMeasureId: selectedUnit.unitId,
      unitOfMeasureName: unitLabel(selectedUnit),
      quantity: qty,
      unitPrice: selectedUnit.price,
      currency: selectedUnit.currency ?? pricedProduct.currency ?? 'IQD',
    });
    toast.success(t('addedToCart'));
    navigate('/cart');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <BackIcon className="h-4 w-4" />
        {t('back')}
      </button>

      <div className="card overflow-hidden">
        <div className="grid sm:grid-cols-2">
          {/* Image gallery */}
          <div className="flex flex-col">
            <div
              className="group relative flex aspect-square w-full select-none items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800 sm:aspect-auto sm:h-80"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {galleryLen > 0 ? (
                <img
                  src={encodeImageUrl(gallery[safeActive])}
                  alt={pricedProduct.name}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              ) : (
                <Package className="h-20 w-20 text-gray-300" />
              )}

              {/* أسهم التصفّح فوق الصورة الكبيرة */}
              {galleryLen > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="previous"
                    className="absolute start-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-md backdrop-blur transition hover:bg-white active:scale-95 dark:bg-gray-900/70 dark:text-gray-100"
                  >
                    {isRtl ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="next"
                    className="absolute end-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-md backdrop-blur transition hover:bg-white active:scale-95 dark:bg-gray-900/70 dark:text-gray-100"
                  >
                    {isRtl ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </button>
                  <div className="absolute bottom-2 end-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white num-display">
                    {safeActive + 1} / {galleryLen}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails — only when there is an album */}
            {galleryLen > 1 && (
              <div className="flex gap-2 overflow-x-auto bg-gray-50 p-2 dark:bg-gray-800/60">
                {gallery.map((src, i) => {
                  const active = i === safeActive;
                  return (
                    <button
                      key={`${src}-${i}`}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        active ? 'border-brand-500' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={encodeImageUrl(src)} alt={`${pricedProduct.name} ${i + 1}`} className="h-full w-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 sm:p-8">
            <div className="mb-2 flex items-center gap-1 text-sm text-gray-500">
              <Building2 className="h-4 w-4" />
              {pricedProduct.companyName}
            </div>

            <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">{pricedProduct.name}</h1>
            {pricedProduct.nameEn && <p className="mb-4 text-sm text-gray-500">{pricedProduct.nameEn}</p>}

            {pricedProduct.description && (
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{pricedProduct.description}</p>
            )}

            {/* Unit selector — ديناميكي من بيانات المنتج */}
            <div className="mb-4">
              <p className="mb-2 text-xs text-gray-500">{t('unit')}</p>
              <div className="flex flex-wrap gap-2">
                {units.map((u) => {
                  const active = u.unitId === selectedUnit.unitId;
                  const ccy = u.currency ?? pricedProduct.currency ?? 'IQD';
                  return (
                    <button
                      key={u.unitId}
                      onClick={() => { setUnitId(u.unitId); setQty(1); }}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        active
                          ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {unitLabel(u)}
                      <span className="ms-1 text-xs opacity-70">
                        (<AmountCurrency amount={u.price} currency={ccy} />)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500">{t('unit')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{unitLabel(selectedUnit)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500">{t('stock')}</p>
                <p className={`font-semibold num-display ${stockInUnit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {stockInUnit > 0 ? formatNumber(stockInUnit) : t('outOfStock')}
                </p>
              </div>
            </div>

            <div className="mb-2">
              <AmountCurrency
                amount={selectedUnit.price}
                currency={selectedUnit.currency ?? pricedProduct.currency}
                amountClassName="text-3xl font-extrabold text-brand-600 dark:text-brand-400"
                currencyClassName="text-base text-brand-500"
              />
            </div>

            {/* Quantity */}
            <div className="mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('quantity')}:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  −
                </button>
                <span className="w-8 text-center font-semibold num-display">{formatNumber(qty)}</span>
                <button
                  onClick={() => setQty((q) => Math.min(stockInUnit, q + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-brand-50 px-3 py-2 text-sm dark:bg-brand-900/20">
              <LineCalcDisplay
                qty={qty}
                unitPrice={selectedUnit.price}
                currency={selectedUnit.currency ?? pricedProduct.currency}
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={stockInUnit <= 0}
              className="btn-primary w-full gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {t('addToCart')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
