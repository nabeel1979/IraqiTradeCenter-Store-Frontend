import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CreditCard, Building2, TrendingUp } from 'lucide-react';
import { companiesApi } from '@/api/companies';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';

export function CustomerCards() {
  const { t } = useTranslation();

  const { data: cards, isLoading } = useQuery({
    queryKey: ['my-cards'],
    queryFn: companiesApi.myCards,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;

  if (!cards?.length) {
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
      {cards.map((card) => (
        <div key={card.id} className="card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-700 p-4 text-white dark:from-gray-700 dark:to-gray-600">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 opacity-70" />
              <span className="text-sm font-semibold">{card.companyName}</span>
            </div>
            <Badge variant={card.isActive ? 'success' : 'danger'}>
              {card.isActive ? t('active') : t('inactive')}
            </Badge>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">كود العميل</span>
              <code className="font-mono font-bold text-gray-900 dark:text-white">{card.customerCode}</code>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-green-50 p-3 dark:bg-green-900/20">
                <p className="text-xs text-green-600 dark:text-green-400">{t('creditLimit')}</p>
                <p className="font-bold text-green-700 dark:text-green-400 text-sm">
                  {formatCurrency(card.creditLimit)}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <TrendingUp className="h-3 w-3" />
                  {t('currentBalance')}
                </div>
                <p className="font-bold text-blue-700 dark:text-blue-400 text-sm">
                  {formatCurrency(card.currentBalance)}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              مرتبط منذ: {new Date(card.linkedAt).toLocaleDateString('ar-IQ')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
