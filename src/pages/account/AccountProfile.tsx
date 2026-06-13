import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { getCountryLabel } from '@/lib/locations';
import { Copy, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function AccountProfile() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(user.userCode);
    setCopied(true);
    toast.success(t('idCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* User Code — Main Feature */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-400 via-brand-500 to-brand-300 p-6 text-white">
          <p className="mb-1 text-sm font-medium opacity-80">{t('userCode')}</p>
          <div className="flex items-center gap-3">
            <code className="text-2xl font-mono font-extrabold tracking-widest">{user.userCode}</code>
            <button onClick={copyCode} className="rounded-lg bg-white/20 p-2 transition hover:bg-white/30">
              {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs opacity-70">أرسل هذا المعرّف للشركة لتفعيل بطاقة العميل</p>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            💡 أرسل معرّف المستخدم للشركة ليُضيفك كعميل ويُفعّل بطاقتك للحصول على أسعار خاصة
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="card divide-y divide-gray-100 dark:divide-gray-800">
        {[
          { label: t('fullName'), value: user.fullName },
          { label: t('whatsappPhone'), value: user.phone },
          { label: t('contactPhone'), value: user.contactPhone },
          { label: t('email'), value: user.email },
          { label: t('country'), value: user.country ? getCountryLabel(user.country, lang) : null },
          { label: t('city'), value: user.city },
          { label: t('address'), value: user.address },
          { label: t('detailedAddress'), value: user.detailedAddress },
          { label: t('accountType'), value: user.accountType === 'Trader' ? t('trader') : t('company') },
        ].filter((row) => row.value).map((row) => (
          <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
            <span className="text-sm text-gray-500">{row.label}</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white" dir="auto">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
