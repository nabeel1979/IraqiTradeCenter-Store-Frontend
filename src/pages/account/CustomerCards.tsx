import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CreditCard, Building2, BookOpen, Tag } from 'lucide-react';
import { companiesApi } from '@/api/companies';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { salesPriceTypeLabel } from '@/lib/priceTypes';
import type { CompanyFinancial, CustomerCard } from '@/types';

type MergedCard = CustomerCard & Partial<CompanyFinancial>;

export function CustomerCards() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? 'ar-IQ' : 'en-US';

  const { data: cards, isLoading: cardsLoading } = useQuery({
    queryKey: ['my-cards'],
    queryFn: companiesApi.myCards,
  });

  const { data: financials, isLoading: finLoading } = useQuery({
    queryKey: ['my-financials'],
    queryFn: companiesApi.financials,
  });

  const merged = useMemo(() => {
    const finMap = new Map((financials ?? []).map(f => [f.companyCode, f]));
    return (cards ?? []).map((card): MergedCard => {
      const fin = finMap.get(card.companyCode);
      return {
        ...card,
        businessName: fin?.businessName ?? card.businessName,
        accountId: fin?.accountId,
        accountCode: fin?.accountCode,
        accountName: fin?.accountName,
        accountNameAr: fin?.accountNameAr,
        accountNameEn: fin?.accountNameEn,
        linked: fin?.linked,
        availableCredit: fin?.availableCredit,
        lastActivity: fin?.lastActivity,
        companyName: fin?.companyName ?? card.companyName,
        customerCode: fin?.customerCode ?? card.customerCode,
        creditLimit: fin?.creditLimit ?? card.creditLimit,
        currentBalance: fin?.currentBalance ?? card.currentBalance,
        isActive: fin?.isActive ?? card.isActive,
        salesPriceType: fin?.salesPriceType,
      };
    });
  }, [cards, financials]);

  const accountLabel = (row: MergedCard) => {
    if (i18n.language === 'en') return row.accountNameEn ?? row.accountName ?? row.accountNameAr;
    return row.accountNameAr ?? row.accountName ?? row.accountNameEn;
  };

  if (cardsLoading || finLoading) {
    return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;
  }

  if (!merged.length) {
    return (
      <EmptyState
        icon={CreditCard}
        title={t('noCards')}
        description={t('noCardsHint')}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {merged.map((card) => (
        <div key={card.id} className="card overflow-hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-700 p-4 text-white dark:from-gray-700 dark:to-gray-600">
            <div className="flex min-w-0 items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 opacity-70" />
              <span className="truncate text-sm font-semibold">{card.companyName}</span>
            </div>
            <Badge variant={card.isActive ? 'success' : 'danger'}>
              {card.isActive ? t('active') : t('inactive')}
            </Badge>
          </div>

          <div className="space-y-3 p-4">
            {card.businessName && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t('businessName')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{card.businessName}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t('customerCode')}</span>
              <code className="font-mono font-bold text-gray-900 dark:text-white">{card.customerCode}</code>
            </div>

            <div className="rounded-xl border border-brand-200/60 bg-brand-50/50 p-3 dark:border-brand-800/40 dark:bg-brand-900/10">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-brand-700 dark:text-brand-300">
                <BookOpen className="h-3.5 w-3.5" />
                {t('financialAccount')}
              </div>
              {card.accountCode ? (
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <code className="font-mono text-sm font-bold text-brand-800 dark:text-brand-200">
                    {card.accountCode}
                  </code>
                  {accountLabel(card) && (
                    <span className="text-sm text-gray-700 dark:text-gray-300">{accountLabel(card)}</span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('noFinancialAccount')}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-amber-200/70 bg-amber-50/60 px-3 py-2.5 text-sm dark:border-amber-800/40 dark:bg-amber-900/10">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Tag className="h-3.5 w-3.5" />
                {t('customerPrice')}
              </span>
              <span className="font-semibold text-amber-800 dark:text-amber-300">
                {salesPriceTypeLabel(card.salesPriceType, i18n.language)}
              </span>
            </div>

            <p className="text-xs text-gray-400">
              {t('linkedSince')}: {new Date(card.linkedAt).toLocaleDateString(locale)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
