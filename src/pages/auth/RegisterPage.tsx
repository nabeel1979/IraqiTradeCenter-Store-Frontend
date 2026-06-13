import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Store, Building2, User, Mail, MessageCircle } from 'lucide-react';
import { authApi, type LoginMethod } from '@/api/auth';
import type { AccountType } from '@/types';

type FormData = {
  phone?: string;
  email?: string;
  accountType: AccountType;
};

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [registerMethod, setRegisterMethod] = useState<LoginMethod>('email');

  const schema = useMemo(() => {
    const base = z.object({ accountType: z.enum(['Trader', 'Company']) });
    if (registerMethod === 'email') {
      return base.extend({
        email: z.string().email(t('validation.emailInvalid')),
        phone: z.string().optional(),
      });
    }
    return base.extend({
      phone: z.string().min(10, t('validation.phoneInvalid')),
      email: z.string().optional(),
    });
  }, [t, registerMethod]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { accountType: 'Trader' },
  });

  const accountType = watch('accountType');
  const isEmail = registerMethod === 'email';

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.requestRegisterOtp({
        method: registerMethod,
        phone: data.phone?.trim(),
        email: data.email?.trim(),
        accountType: data.accountType,
      });
      const resChannel = res.channel === 'email' ? 'email' : 'whatsapp';
      toast.success(res.message ?? (isEmail ? t('registerOtpSentEmail') : t('registerOtpSent')));
      navigate('/auth/verify', {
        state: {
          phone: res.phone ?? data.phone ?? '',
          purpose: 'register',
          channel: resChannel,
          email: res.emailHint ?? data.email ?? '',
          registerMethod,
        },
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('registerError'));
    } finally {
      setLoading(false);
    }
  };

  const HintIcon = isEmail ? Mail : MessageCircle;
  const hintClass = isEmail
    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500">
            <Store className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('register')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('registerMethodHint')}</p>
        </div>

        <div className="card p-6">
          <div className="mb-4 grid grid-cols-2 gap-3">
            {(['whatsapp', 'email'] as LoginMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setRegisterMethod(method)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                  registerMethod === method
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                {method === 'whatsapp' ? (
                  <MessageCircle className={`h-5 w-5 ${registerMethod === method ? 'text-emerald-600' : 'text-gray-400'}`} />
                ) : (
                  <Mail className={`h-5 w-5 ${registerMethod === method ? 'text-brand-500' : 'text-gray-400'}`} />
                )}
                <span className={`text-xs font-semibold sm:text-sm ${registerMethod === method ? 'text-brand-600' : 'text-gray-600 dark:text-gray-400'}`}>
                  {method === 'whatsapp' ? t('loginMethodWhatsapp') : t('loginMethodEmail')}
                </span>
              </button>
            ))}
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            {(['Trader', 'Company'] as AccountType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue('accountType', type)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  accountType === type
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                {type === 'Trader' ? (
                  <User className={`h-6 w-6 ${accountType === type ? 'text-brand-500' : 'text-gray-400'}`} />
                ) : (
                  <Building2 className={`h-6 w-6 ${accountType === type ? 'text-brand-500' : 'text-gray-400'}`} />
                )}
                <span className={`text-sm font-semibold ${accountType === type ? 'text-brand-600' : 'text-gray-600 dark:text-gray-400'}`}>
                  {type === 'Trader' ? t('trader') : t('company')}
                </span>
              </button>
            ))}
          </div>

          {accountType === 'Company' && (
            <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              {t('companyAccountNote')}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isEmail ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
                <input {...register('email')} type="email" className="input" placeholder="name@example.com" dir="ltr" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('whatsappPhone')}</label>
                <input {...register('phone')} className="input" placeholder="07xxxxxxxxx" dir="ltr" />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>
            )}

            <div className={`flex items-start gap-2 rounded-xl p-3 text-xs ${hintClass}`}>
              <HintIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{isEmail ? t('registerEmailHint') : t('registerWhatsappHint')}</span>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('loading') : t('sendRegisterOtp')}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
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
