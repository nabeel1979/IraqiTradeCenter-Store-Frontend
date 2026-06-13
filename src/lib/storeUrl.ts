import type { Company } from '@/types';

const MAIN_STORE_HOSTS = new Set([
  'iraqi-trade-center.iq',
  'www.iraqi-trade-center.iq',
  'store.iraqi-trade-center.iq',
]);

export function getMainStoreUrl(path = '/'): string {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//iraqi-trade-center.iq${path}`;
  }
  return `https://iraqi-trade-center.iq${path}`;
}

export function getCompanyStoreUrl(company: Pick<Company, 'companyCode'>): string {
  const code = company.companyCode.toUpperCase();

  // Every company store opens INSIDE the main store project (single
  // deployment, single SSL cert) via the path: iraqi-trade-center.iq/store/{CODE}
  const base =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//iraqi-trade-center.iq`
      : 'https://iraqi-trade-center.iq';
  return `${base}/store/${code}`;
}

export function isMainStoreHost(host = window.location.hostname): boolean {
  return MAIN_STORE_HOSTS.has(host.toLowerCase());
}
