import { ShoppingCart, Building2, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { encodeImageUrl, formatNumber } from '@/lib/utils';
import { AmountCurrency } from '@/components/ui/AmountCurrency';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const { t } = useTranslation();
  const isAr = i18n.language === 'ar';
  const unitLabel = isAr ? product.unitOfMeasureName : (product.unitOfMeasureNameEn || product.unitOfMeasureName);
  const addItem = useCartStore((s) => s.addItem);
  const imageSrc = product.imageUrl ? encodeImageUrl(product.imageUrl) : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      productName: product.name,
      companyCode: product.companyCode,
      companyName: product.companyName,
      unitOfMeasureId: product.unitOfMeasureId,
      unitOfMeasureName: product.unitOfMeasureName,
      quantity: 1,
      unitPrice: product.sellingPrice,
      currency: product.currency ?? 'IQD',
    });
    toast.success(t('addedToCart'));
  };

  return (
    <Link
      to={`/products/${product.companyCode}/${product.id}`}
      className="card group flex flex-col overflow-hidden transition hover:shadow-md"
    >
      {/* Image placeholder */}
      <div className="flex h-40 items-center justify-center bg-gray-100 dark:bg-gray-800">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <Package className="h-12 w-12 text-gray-300" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Company */}
        <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
          <Building2 className="h-3 w-3" />
          {product.companyName}
        </div>

        {/* Name */}
        <p className="mb-1 font-semibold text-gray-900 dark:text-white line-clamp-2 text-sm leading-snug">
          {product.name}
        </p>

        {/* Unit */}
        <p className="text-xs text-gray-500 mb-3">
          {t('unit')}: {unitLabel}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <div>
            <AmountCurrency
              amount={product.sellingPrice}
              currency={product.currency}
              amountClassName="text-base font-bold text-brand-600 dark:text-brand-400"
            />
            <p className="text-xs text-gray-400">
              {product.currentStock > 0
                ? <>{t('stock')}: <span className="num-display">{formatNumber(product.currentStock)}</span></>
                : t('outOfStock')}
            </p>
          </div>

          <button
            onClick={handleAdd}
            disabled={product.currentStock <= 0}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
