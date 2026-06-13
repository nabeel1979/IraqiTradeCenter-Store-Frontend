import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { UserCircle } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { COUNTRIES, getCitiesForCountry } from '@/lib/locations';

type FormData = {
  fullName: string;
  contactPhone: string;
  email: string;
  country: string;
  city: string;
  address: string;
  detailedAddress: string;
};

export function CompleteProfilePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, token, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const lang = i18n.language === 'ar' ? 'ar' : 'en';

  const schema = useMemo(() => z.object({
    fullName: z.string().refine(
      (v) => v.trim().split(/\s+/).filter(Boolean).length >= 3,
      t('validation.tripleNameRequired'),
    ),
    contactPhone: z.string().min(10, t('validation.phoneInvalid')),
    email: z.string().email(t('validation.emailInvalid')),
    country: z.string().min(1, t('validation.countryRequired')),
    city: z.string().min(1, t('validation.cityRequired')),
    address: z.string().min(3, t('validation.addressRequired')),
    detailedAddress: z.string().min(5, t('validation.detailedAddressRequired')),
  }), [t]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      country: 'IQ',
      contactPhone: user?.phone ?? '',
    },
  });

  const country = watch('country');
  const city = watch('city');
  const cities = getCitiesForCountry(country);

  useEffect(() => {
    if (!token) {
      navigate('/auth/register', { replace: true });
      return;
    }
    if (user?.isProfileCompleted === true) {
      navigate('/account', { replace: true });
    }
  }, [token, user, navigate]);

  useEffect(() => {
    if (cities.length > 0) {
      if (!city || !cities.includes(city as typeof cities[number])) {
        setValue('city', cities[0]);
      }
    }
  }, [country, cities, city, setValue]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.completeProfile(data);
      setAuth(res.user, res.token);
      toast.success(t('profileCompleted'));
      navigate('/account');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('registerError'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500">
            <UserCircle className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('completeProfile')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('completeProfileSubtitle')}</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('tripleName')}
              </label>
              <input {...register('fullName')} className="input" placeholder={t('tripleNamePlaceholder')} />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('contactPhone')}
              </label>
              <input {...register('contactPhone')} className="input" placeholder="07xxxxxxxxx" dir="ltr" />
              {errors.contactPhone && <p className="mt-1 text-xs text-red-500">{errors.contactPhone.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('email')}
              </label>
              <input {...register('email')} type="email" className="input" placeholder="example@email.com" dir="ltr" />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('country')}
                </label>
                <select {...register('country')} className="input">
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {lang === 'ar' ? c.nameAr : c.nameEn}
                    </option>
                  ))}
                </select>
                {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('city')}
                </label>
                {cities.length > 0 ? (
                  <select {...register('city')} className="input">
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                ) : (
                  <input {...register('city')} className="input" placeholder={t('cityPlaceholder')} />
                )}
                {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('address')}
              </label>
              <input {...register('address')} className="input" placeholder={t('addressPlaceholder')} />
              {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('detailedAddress')}
              </label>
              <textarea
                {...register('detailedAddress')}
                className="input min-h-[88px] resize-none"
                placeholder={t('detailedAddressPlaceholder')}
                rows={3}
              />
              {errors.detailedAddress && <p className="mt-1 text-xs text-red-500">{errors.detailedAddress.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('loading') : t('completeRegistration')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
