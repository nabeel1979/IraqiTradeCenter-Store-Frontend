import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
  amount: number;
  currency?: string;
  amountClassName?: string;
  currencyClassName?: string;
  decimals?: number;
}

/** مبلغ بأرقام إنجليزية + رمز العملة منفصل */
export function AmountCurrency({
  amount,
  currency = 'IQD',
  amountClassName,
  currencyClassName,
  decimals = 0,
}: Props) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={cn('num-display', amountClassName)}>{formatNumber(amount, decimals)}</span>
      <span className={cn('text-xs font-semibold text-gray-500', currencyClassName)}>{currency}</span>
    </span>
  );
}

interface LineCalcProps {
  qty: number;
  unitPrice: number;
  currency?: string;
  className?: string;
}

/** 8 × 10 = 80  +  IQD */
export function LineCalcDisplay({ qty, unitPrice, currency = 'IQD', className }: LineCalcProps) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-2', className)}>
      <span className="num-display font-semibold">
        {`${formatNumber(qty)} × ${formatNumber(unitPrice)} = ${formatNumber(qty * unitPrice)}`}
      </span>
      <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
        {currency}
      </span>
    </span>
  );
}
