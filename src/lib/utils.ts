import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function encodeImageUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      parsed.pathname = parsed.pathname
        .split('/')
        .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
        .join('/');
      return parsed.toString();
    } catch {
      return url;
    }
  }
  return url;
}

/** أرقام إنجليزية (Western) دائماً */
export function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** مبلغ بدون رمز العملة — للعرض مع عنوان مستقل للعملة */
export function formatAmount(amount: number, currency = 'IQD') {
  const decimals = currency === 'IQD' ? 0 : 2;
  return formatNumber(amount, decimals);
}

export function formatCurrency(amount: number, currency = 'IQD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'IQD' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${formatNumber(amount)} ${currency}`;
  }
}

/** عرض حساب السطر بأرقام فقط: 8 × 10 = 80 (العملة تُعرض منفصلة) */
export function formatLineCalc(qty: number, unitPrice: number) {
  const total = qty * unitPrice;
  return `${formatNumber(qty)} × ${formatNumber(unitPrice)} = ${formatNumber(total)}`;
}

export function formatDate(dateStr: string, locale = 'ar-IQ') {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr));
}

export function getOrderStatusColor(status: string) {
  const map: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Received: 'bg-sky-100 text-sky-800',
    InProcessing: 'bg-blue-100 text-blue-800',
    InvoiceIssued: 'bg-emerald-100 text-emerald-800',
    Shipping: 'bg-indigo-100 text-indigo-800',
    Delivered: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
}

export function getOrderStatusLabel(status: string, isAr = true) {
  const ar: Record<string, string> = {
    Pending: 'الواردة',
    Received: 'المستلمة',
    InProcessing: 'قيد المعالجة',
    InvoiceIssued: 'اصدار فاتورة',
    Shipping: 'قيد الشحن',
    Delivered: 'مستلمة',
    Rejected: 'مرفوضة',
  };
  const en: Record<string, string> = {
    Pending: 'Incoming',
    Received: 'Received',
    InProcessing: 'In Processing',
    InvoiceIssued: 'Invoice Issued',
    Shipping: 'Shipping',
    Delivered: 'Delivered',
    Rejected: 'Rejected',
  };
  return (isAr ? ar : en)[status] ?? status;
}
