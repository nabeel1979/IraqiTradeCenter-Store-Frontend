import { isMainStoreHost } from '@/lib/storeUrl';

const STORE_KEY = 'itc-company-code';

/**
 * Resolves the active company store code. Each company opens INSIDE the main
 * store project (single deployment, single SSL cert) via the path:
 *   iraqi-trade-center.iq/store/{CODE}
 *
 * Resolution order:
 *   1. Path  /store/{CODE}            (canonical, shareable link)
 *   2. Query ?company=CODE            (legacy / convenience)
 *   3. Subdomain store.{CODE}...      (legacy, kept for back-compat)
 *   4. sessionStorage                 (keeps context across SPA navigation/refresh)
 */
export function getCompanyCode(): string | null {
  const host = window.location.hostname;

  const pathMatch = window.location.pathname.match(/^\/store\/([a-zA-Z0-9]+)/i);
  if (pathMatch) {
    const code = pathMatch[1].toUpperCase();
    persist(code);
    return code;
  }

  const qp = new URLSearchParams(window.location.search).get('company');
  if (qp) {
    const code = qp.toUpperCase();
    persist(code);
    return code;
  }

  const prodMatch = host.match(/^store\.([a-zA-Z0-9]+)\.iraqi-trade-center\.iq$/i);
  if (prodMatch) return prodMatch[1].toUpperCase();

  try {
    const stored = sessionStorage.getItem(STORE_KEY);
    if (stored) return stored;
  } catch {
    /* sessionStorage unavailable */
  }

  return null;
}

function persist(code: string) {
  try {
    sessionStorage.setItem(STORE_KEY, code);
  } catch {
    /* sessionStorage unavailable */
  }
}

/** Exit a company store and return to the main (multi-company) store. */
export function clearCompanyCode(): void {
  try {
    sessionStorage.removeItem(STORE_KEY);
  } catch {
    /* sessionStorage unavailable */
  }
}

/** Host may be a genuinely custom per-company store domain (resolved via API). */
export function needsHostResolution(): boolean {
  const host = window.location.hostname;
  if (isMainStoreHost(host) || host === 'localhost' || host === '127.0.0.1') return false;
  return getCompanyCode() === null;
}

export function isCompanyStore(): boolean {
  return getCompanyCode() !== null;
}
