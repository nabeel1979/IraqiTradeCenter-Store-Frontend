import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, Package } from 'lucide-react';
import { productsApi } from '@/api/products';
import { companiesApi } from '@/api/companies';
import { ProductCard } from '@/components/ProductCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCompanyStore } from '@/store/companyStore';
import { useAuthStore } from '@/store/authStore';

export function ProductsPage() {
  const { t } = useTranslation();
  const { companyCode: fixedCompany } = useCompanyStore();
  const authed = !!useAuthStore((s) => s.token);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState(() => searchParams.get('company')?.toUpperCase() ?? '');
  const [page, setPage] = useState(1);

  // In company-store mode, always filter by the fixed company
  const activeCompany = fixedCompany ?? (filterCompany || undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { search, activeCompany, page, authed }],
    queryFn: () => productsApi.list({ search, companyCode: activeCompany, pageNumber: page, pageSize: 16 }),
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesApi.list(),
    enabled: !fixedCompany, // only load in multi-company mode
  });

  const selectedCompanyName = companies?.find((c) => c.companyCode === activeCompany)?.name;

  const handleCompanyChange = (value: string) => {
    setFilterCompany(value);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('company', value);
    else next.delete('company');
    setSearchParams(next, { replace: true });
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">{t('products')}</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input ps-10"
            placeholder={t('search')}
          />
        </div>
        {/* Company filter — hidden in single-company store mode */}
        {!fixedCompany && (
          <select
            value={filterCompany}
            onChange={(e) => handleCompanyChange(e.target.value)}
            className="input sm:w-52"
          >
            <option value="">{t('allCompanies')}</option>
            {companies?.map((c) => (
              <option key={c.companyCode} value={c.companyCode}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner className="h-10 w-10" /></div>
      ) : !data?.items.length ? (
        <EmptyState
          icon={Package}
          title={activeCompany ? t('noProductsForCompany') : t('noProducts')}
          description={activeCompany && selectedCompanyName ? selectedCompanyName : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((p) => (
              <ProductCard key={`${p.companyCode}-${p.id}`} product={p} />
            ))}
          </div>

          {/* Pagination */}
          {data.totalCount > 16 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-outline px-4 py-2 text-sm"
              >
                {t('prev')}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('pageOf', { current: page, total: Math.ceil(data.totalCount / 16) })}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 16 >= data.totalCount}
                className="btn-outline px-4 py-2 text-sm"
              >
                {t('next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
