import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { getCountryLabel } from '@/lib/locations';
import {
  Copy,
  CheckCheck,
  Mail,
  MapPin,
  Phone,
  User,
  Building2,
  Hash,
  Lightbulb,
  Lock,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { LucideIcon } from 'lucide-react';

interface ProfileField {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
}

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

  const initials = user.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  const accountTypeLabel = user.accountType === 'Trader' ? t('trader') : t('company');

  const fields: ProfileField[] = [
    { key: 'whatsapp', label: t('whatsappPhone'), value: user.phone, icon: Phone },
    user.contactPhone && user.contactPhone !== user.phone
      ? { key: 'contact', label: t('contactPhone'), value: user.contactPhone, icon: Phone }
      : null,
    user.email ? { key: 'email', label: t('email'), value: user.email, icon: Mail } : null,
    user.country
      ? { key: 'country', label: t('country'), value: getCountryLabel(user.country, lang), icon: MapPin }
      : null,
    user.city ? { key: 'city', label: t('city'), value: user.city, icon: MapPin } : null,
    user.address ? { key: 'address', label: t('address'), value: user.address, icon: MapPin } : null,
    user.detailedAddress
      ? { key: 'detailedAddress', label: t('detailedAddress'), value: user.detailedAddress, icon: MapPin }
      : null,
  ].filter((f): f is ProfileField => !!f && !!f.value);

  return (
    <div className="card overflow-hidden">
      {/* Identity */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white shadow-sm">
          {initials || <User className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h1 className="truncate text-base font-bold text-gray-900 dark:text-white">{user.fullName}</h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              {user.accountType === 'Company' ? (
                <Building2 className="h-3 w-3" />
              ) : (
                <User className="h-3 w-3" />
              )}
              {accountTypeLabel}
            </span>
          </div>
          {user.email && (
            <p className="truncate text-xs text-gray-500 dark:text-gray-400" dir="ltr">
              {user.email}
            </p>
          )}
        </div>
      </div>

      {/* User ID */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/40">
        <div className="flex min-w-0 items-center gap-2">
          <Hash className="h-3.5 w-3.5 shrink-0 text-brand-500" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{t('userCode')}</p>
            <code className="block truncate font-mono text-sm font-bold tracking-wide text-brand-600 dark:text-brand-400">
              {user.userCode}
            </code>
          </div>
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-50 dark:border-brand-800 dark:bg-gray-900 dark:text-brand-300 dark:hover:bg-brand-900/20"
        >
          {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? t('idCopied') : t('copy')}
        </button>
      </div>

      <p className="flex items-start gap-1.5 border-b border-amber-100 bg-amber-50/60 px-4 py-2 text-[11px] leading-relaxed text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t('userCodeHint')}
      </p>

      {user.contactLocked && (
        <p className="flex items-start gap-1.5 border-b border-rose-100 bg-rose-50/60 px-4 py-2 text-[11px] leading-relaxed text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-400">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t('contactLockedNotice')}
        </p>
      )}

      {/* Details grid */}
      <dl className="divide-y divide-gray-100 dark:divide-gray-800 sm:grid sm:grid-cols-2 sm:divide-y-0">
        {fields.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.key}
              className="flex gap-2.5 px-4 py-2.5 sm:border-b sm:border-gray-100 sm:odd:border-e dark:sm:border-gray-800"
            >
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                <dt className="text-[11px] text-gray-400">{row.label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100" dir="auto">
                  {row.value}
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
