import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { productsApi } from '@/api/products';
import { Spinner } from '@/components/ui/Spinner';
import { ProductCard } from '@/components/ProductCard';
import { LogoViewer } from '@/components/LogoViewer';
import { useCompanyStore } from '@/store/companyStore';
import { useAuthStore } from '@/store/authStore';
import i18n from '@/i18n';

export function HomePage() {
  const { t } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const { companyCode, companyInfo } = useCompanyStore();
  const authed = !!useAuthStore((s) => s.token);

  const { data: productsData, isLoading: pLoading } = useQuery({
    queryKey: ['products', 'featured', companyCode, authed],
    queryFn: () => productsApi.list({ pageSize: 8, companyCode: companyCode ?? undefined }),
  });

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-brand-200/60 bg-gradient-to-br from-surface-card via-brand-50 to-brand-100/70 px-5 py-6 shadow-sm sm:px-8 sm:py-8 dark:border-brand-800/40 dark:from-gray-900 dark:via-gray-900 dark:to-brand-950/30">
        <div className="relative z-10 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
          <LogoViewer
            alt={companyInfo?.name ?? t('siteName')}
            className="h-14 w-14 shrink-0 object-contain sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28"
          />
          <div className="text-center sm:text-start">
            <h1 className="mb-2 text-xl font-extrabold leading-tight text-brand-800 sm:text-2xl dark:text-brand-100">
              {companyInfo ? companyInfo.name : t('siteName')}
            </h1>
            <p className="mb-5 text-sm text-gray-600 sm:text-base dark:text-gray-300">
              {companyInfo
                ? t('heroCompanyWelcome', { name: companyInfo.name })
                : t('siteTagline')}
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <Link to="/products" className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
                {t('products')} <ArrowIcon className="h-4 w-4" />
              </Link>
              <Link
                to={authed ? '/account' : '/auth/register'}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-400 bg-white/80 px-4 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-50 dark:border-brand-600 dark:bg-gray-900/50 dark:text-brand-300 dark:hover:bg-brand-950/40"
              >
                {authed ? t('myAccount') : t('register')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('featuredProducts')}</h2>
          <Link to="/products" className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600">
            {t('showMore')} <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
        {pLoading ? (
          <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productsData?.items.map((p) => <ProductCard key={`${p.companyCode}-${p.id}`} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
