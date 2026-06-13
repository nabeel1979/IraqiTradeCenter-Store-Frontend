import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import { useQuery } from '@tanstack/react-query';

import { Building2, Search, Package, Share2, ExternalLink, Contact } from 'lucide-react';

import { toast } from 'sonner';

import { companiesApi } from '@/api/companies';

import { useCompanyStore } from '@/store/companyStore';

import { getCompanyStoreUrl } from '@/lib/storeUrl';

import { Spinner } from '@/components/ui/Spinner';

import { EmptyState } from '@/components/ui/EmptyState';
import { CompanyContactDialog } from '@/components/CompanyContactDialog';

import type { Company } from '@/types';



async function copyStoreLink(company: Company, t: (key: string) => string) {
  const url = getCompanyStoreUrl(company);
  try {
    await navigator.clipboard.writeText(url);
    toast.success(t('copyLinkSuccess'));
  } catch {
    toast.error(t('copyLinkFailed'));
  }
}



export function CompaniesPage() {

  const { t } = useTranslation();

  const { companyCode } = useCompanyStore();

  const navigate = useNavigate();



  useEffect(() => {

    if (companyCode) navigate('/products', { replace: true });

  }, [companyCode, navigate]);



  const [search, setSearch] = useState('');
  const [contactCompany, setContactCompany] = useState<Company | null>(null);



  const { data: companies, isLoading } = useQuery({

    queryKey: ['companies', search],

    queryFn: () => companiesApi.list(search || undefined),

  });



  return (

    <div>

      <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{t('companies')}</h1>

      <p className="mb-6 text-sm text-gray-500">{t('companiesHint')}</p>



      <div className="relative mb-6">

        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

        <input

          value={search}

          onChange={(e) => setSearch(e.target.value)}

          className="input ps-10"

          placeholder={t('search')}

        />

      </div>



      {isLoading ? (

        <div className="flex justify-center py-20"><Spinner className="h-10 w-10" /></div>

      ) : !companies?.length ? (

        <EmptyState icon={Building2} title={t('noCompanies')} />

      ) : (

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {companies.map((c) => {

            const storeUrl = getCompanyStoreUrl(c);

            return (

              <div key={c.id} className="card flex flex-col gap-4 p-5">

                <div className="flex gap-4">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">

                    <Building2 className="h-7 w-7 text-brand-500" />

                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="font-bold text-gray-900 dark:text-white truncate">{c.name}</p>

                    <p className="text-sm text-gray-500 truncate">{c.activity}</p>

                    {c.address && <p className="text-xs text-gray-400 mt-1 truncate">{c.address}</p>}

                  </div>

                </div>



                <div className="flex flex-wrap items-center gap-2">

                  <a

                    href={storeUrl}

                    target="_blank"

                    rel="noreferrer"

                    className="btn-primary inline-flex items-center gap-1 px-3 py-2 text-xs"

                  >

                    <ExternalLink className="h-3.5 w-3.5" />

                    {t('openStore')}

                  </a>

                  <button

                    type="button"

                    onClick={() => copyStoreLink(c, t)}

                    className="btn-outline inline-flex items-center gap-1 px-3 py-2 text-xs"

                  >

                    <Share2 className="h-3.5 w-3.5" />

                    {t('shareStore')}

                  </button>

                  <button

                    type="button"

                    onClick={() => setContactCompany(c)}

                    className="btn-outline inline-flex items-center gap-1 px-3 py-2 text-xs"

                  >

                    <Contact className="h-3.5 w-3.5" />

                    {t('companyContact')}

                  </button>

                </div>



                <a

                  href={`${storeUrl}/products`}

                  target="_blank"

                  rel="noreferrer"

                  className="mt-auto flex items-center gap-1 text-xs text-brand-500 hover:underline"

                >

                  <Package className="h-3 w-3" />

                  <span>{t('viewProducts')}</span>

                </a>

              </div>

            );

          })}

        </div>

      )}

      {contactCompany && (
        <CompanyContactDialog
          companyCode={contactCompany.companyCode}
          companyName={contactCompany.name}
          onClose={() => setContactCompany(null)}
        />
      )}

    </div>

  );

}


