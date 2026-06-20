import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Store, Mail, MessageCircle, ChevronsUpDown, Search } from 'lucide-react';
import { authApi, geographyApi, type LoginMethod, type GeoCountry, type GeoCity } from '@/api/auth';
import { PhoneInput } from '@/components/shared/PhoneInput';
import type { AccountType } from '@/types';

type Option = { value: number; label: string };

export function RegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const [loading, setLoading] = useState(false);

  const [accountType, setAccountType] = useState<AccountType>('Customer');
  const [otpChannel, setOtpChannel] = useState<LoginMethod>('email');

  const [fullName, setFullName] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessNameEn, setBusinessNameEn] = useState('');
  const [countryId, setCountryId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [addressAr, setAddressAr] = useState('');
  const [addressEn, setAddressEn] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [error, setError] = useState('');

  const isBusiness = accountType === 'Trader' || accountType === 'Company';
  const isCompany = accountType === 'Company';

  const { data: countries = [] } = useQuery({
    queryKey: ['store-countries'],
    queryFn: geographyApi.countries,
    staleTime: 60 * 60 * 1000,
  });
  const { data: cities = [] } = useQuery({
    queryKey: ['store-cities', countryId],
    queryFn: () => geographyApi.cities(countryId ?? undefined),
    enabled: !!countryId,
    staleTime: 60 * 60 * 1000,
  });

  const nameOf = (c: GeoCountry | GeoCity) => (lang === 'ar' ? c.nameAr : c.nameEn || c.nameAr);
  const countryOpts: Option[] = useMemo(
    () => countries.map((c) => ({ value: c.id, label: nameOf(c) })),
    [countries, lang],
  );
  const cityOpts: Option[] = useMemo(
    () => cities.map((c) => ({ value: c.id, label: nameOf(c) })),
    [cities, lang],
  );

  // افتراضي: العراق
  const defaultedCountry = useRef(false);
  useEffect(() => {
    if (defaultedCountry.current || countryId || countries.length === 0) return;
    const iq = countries.find((c) => c.code === 'IQ') ?? countries.find((c) => c.nameAr.includes('العراق'));
    if (iq) {
      setCountryId(iq.id);
      defaultedCountry.current = true;
    }
  }, [countries, countryId]);

  // افتراضي: بغداد
  const defaultedCity = useRef(false);
  useEffect(() => {
    if (defaultedCity.current || cityId || cities.length === 0) return;
    const bgd = cities.find((c) => c.nameAr.includes('بغداد'));
    if (bgd) {
      setCityId(bgd.id);
      defaultedCity.current = true;
    }
  }, [cities, cityId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (fullName.trim().split(/\s+/).filter(Boolean).length < 3) {
      setError(t('validation.tripleNameRequired'));
      return;
    }
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError(t('validation.emailInvalid'));
      return;
    }
    if (whatsapp.trim().length < 10) {
      setError(t('validation.phoneInvalid'));
      return;
    }
    if (isBusiness && !businessName.trim()) {
      setError(t('regBusinessNameAr'));
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.requestRegisterOtp({
        method: otpChannel,
        accountType,
        phone: whatsapp.trim(),
        email: email.trim(),
        fullName: fullName.trim(),
        fullNameEn: fullNameEn.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        businessName: isBusiness ? businessName.trim() : undefined,
        businessNameEn: isBusiness ? businessNameEn.trim() || undefined : undefined,
        countryId,
        cityId,
        detailedAddress: addressAr.trim() || undefined,
        detailedAddressEn: addressEn.trim() || undefined,
        locationUrl: locationUrl.trim() || undefined,
      });
      const resChannel = res.channel === 'email' ? 'email' : 'whatsapp';
      if (res.fallbackUsed) toast.warning(res.message);
      else toast.success(res.message ?? t('sendRegisterOtp'));
      navigate('/auth/verify', {
        state: {
          phone: res.phone ?? whatsapp,
          purpose: 'register',
          channel: resChannel,
          email: res.emailHint ?? email,
          registerMethod: otpChannel,
          accountType,
          deliveryMessage: res.message,
          whatsappSent: res.whatsappSent,
          emailSent: res.emailSent,
        },
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500">
            <Store className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('regTitle')}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{t('regSubtitle')}</p>
        </div>

        <div className="card p-5">
          <form onSubmit={onSubmit} className="space-y-3.5">
            {/* نوع الحساب */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('regChooseType')}</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                className="input"
              >
                <option value="Customer">{t('regTypeCustomer')} — {t('regTypeCustomerDesc')}</option>
                <option value="Trader">{t('regTypeTrader')} — {t('regTypeTraderDesc')}</option>
                <option value="Company">{t('regTypeCompany')} — {t('regTypeCompanyDesc')}</option>
              </select>
            </div>

            {isCompany && (
              <div className="rounded-xl bg-amber-50 p-2.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                {t('regCompanyApprovalNote')}
              </div>
            )}

            {/* الأسماء */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t('regNameAr')}>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder={t('regNameArPlaceholder')} />
              </Field>
              <Field label={t('regNameEn')}>
                <input value={fullNameEn} onChange={(e) => setFullNameEn(e.target.value)} className="input" placeholder={t('regNameEnPlaceholder')} dir="ltr" />
              </Field>
            </div>

            {isBusiness && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t('regBusinessNameAr')}>
                  <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="input" placeholder={t('regBusinessNamePlaceholder')} />
                </Field>
                <Field label={t('regBusinessNameEn')}>
                  <input value={businessNameEn} onChange={(e) => setBusinessNameEn(e.target.value)} className="input" placeholder={t('regBusinessNamePlaceholder')} dir="ltr" />
                </Field>
              </div>
            )}

            {/* تواصل */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t('regPhone')}>
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="input" placeholder="07xxxxxxxxx" dir="ltr" />
              </Field>
              <Field label={t('regEmail')}>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input" placeholder="name@example.com" dir="ltr" />
              </Field>
            </div>

            <Field label={t('regWhatsapp')}>
              <PhoneInput value={whatsapp} onChange={setWhatsapp} />
            </Field>

            {/* قناة OTP */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('regOtpVia')}</label>
              <div className="grid grid-cols-2 gap-2">
                {(['email', 'whatsapp'] as LoginMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setOtpChannel(m)}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 p-2 text-sm font-medium transition-all ${
                      otpChannel === m
                        ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {m === 'email' ? <Mail className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                    {m === 'email' ? t('loginMethodEmail') : t('loginMethodWhatsapp')}
                  </button>
                ))}
              </div>
            </div>

            {/* الموقع */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t('regCountry')}>
                <SearchableSelect
                  value={countryId}
                  onChange={(v) => { setCountryId(v); setCityId(null); defaultedCity.current = true; }}
                  options={countryOpts}
                  placeholder={t('regSelectCountry')}
                  searchPlaceholder={t('regSearchPlaceholder')}
                  noResults={t('regNoResults')}
                />
              </Field>
              <Field label={t('regCity')}>
                <SearchableSelect
                  value={cityId}
                  onChange={setCityId}
                  options={cityOpts}
                  placeholder={t('regSelectCity')}
                  searchPlaceholder={t('regSearchPlaceholder')}
                  noResults={t('regNoResults')}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t('regAddressAr')}>
                <input value={addressAr} onChange={(e) => setAddressAr(e.target.value)} className="input" placeholder={t('regAddressPlaceholder')} />
              </Field>
              <Field label={t('regAddressEn')}>
                <input value={addressEn} onChange={(e) => setAddressEn(e.target.value)} className="input" placeholder={t('regAddressPlaceholder')} dir="ltr" />
              </Field>
            </div>

            <Field label={t('regLocationUrl')}>
              <input value={locationUrl} onChange={(e) => setLocationUrl(e.target.value)} className="input" placeholder={t('regLocationUrlPlaceholder')} dir="ltr" />
            </Field>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('loading') : isCompany ? t('regSubmitCompany') : t('regSubmit')}
            </button>
          </form>

          <p className="mt-3 text-center text-sm text-gray-500">
            {t('alreadyHaveAccount')}{' '}
            <Link to="/auth/login" className="font-semibold text-brand-500 hover:text-brand-600">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  );
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  noResults,
}: {
  value: number | null;
  onChange: (v: number) => void;
  options: Option[];
  placeholder: string;
  searchPlaceholder: string;
  noResults: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = q.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()))
    : options;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex w-full items-center justify-between gap-2 text-start"
      >
        <span className={selected ? 'truncate' : 'truncate text-gray-400'}>{selected?.label ?? placeholder}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="relative p-2">
            <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 ltr:left-4 rtl:right-4 h-4 w-4 text-gray-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="input ltr:pl-9 rtl:pr-9"
            />
          </div>
          <div className="max-h-56 overflow-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">{noResults}</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQ('');
                  }}
                  className={`block w-full px-3 py-2 text-start text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    o.value === value ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
