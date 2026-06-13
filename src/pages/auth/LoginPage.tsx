import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, MessageCircle } from 'lucide-react';
import { authApi, type LoginMethod } from '@/api/auth';

type FormData = {
  phone?: string;
  email?: string;
};

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');

  const schema = useMemo(() => {
    if (loginMethod === 'email') {
      return z.object({
        email: z.string().email(t('validation.emailInvalid')),
        phone: z.string().optional(),
      });
    }
    return z.object({
      phone: z.string().min(10, t('validation.phoneInvalid')),
      email: z.string().optional(),
    });
  }, [t, loginMethod]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const isEmail = loginMethod === 'email';
  const Icon = isEmail ? Mail : MessageCircle;
  const iconBg = isEmail ? 'bg-brand-500' : 'bg-emerald-600';

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.requestLoginOtp({
        method: loginMethod,
        phone: data.phone?.trim(),
        email: data.email?.trim(),
      });
      const resChannel = res.channel === 'email' ? 'email' : 'whatsapp';
      toast.success(res.message ?? (isEmail ? t('loginOtpSentEmail') : t('loginOtpSent')));
      navigate('/auth/verify', {
        state: {
          phone: res.phone ?? data.phone?.trim() ?? '',
          purpose: 'login',
          channel: resChannel,
          email: res.emailHint ?? data.email ?? '',
          loginMethod,
        },
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('loginOtpFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg}`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('login')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('loginMethodHint')}</p>
        </div>

        <div className="card p-6">
          <div className="mb-6 grid grid-cols-2 gap-3">
            {(['whatsapp', 'email'] as LoginMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setLoginMethod(method)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  loginMethod === method
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                {method === 'whatsapp' ? (
                  <MessageCircle className={`h-6 w-6 ${loginMethod === method ? 'text-emerald-600' : 'text-gray-400'}`} />
                ) : (
                  <Mail className={`h-6 w-6 ${loginMethod === method ? 'text-brand-500' : 'text-gray-400'}`} />
                )}
                <span className={`text-sm font-semibold ${loginMethod === method ? 'text-brand-600' : 'text-gray-600 dark:text-gray-400'}`}>
                  {method === 'whatsapp' ? t('loginMethodWhatsapp') : t('loginMethodEmail')}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isEmail ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
                <input {...register('email')} type="email" className="input" placeholder="name@example.com" dir="ltr" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                <p className="mt-1.5 text-xs text-gray-500">{t('loginEmailNote')}</p>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('whatsappPhone')}</label>
                <input {...register('phone')} className="input" placeholder="07xxxxxxxxx" dir="ltr" />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                <p className="mt-1.5 text-xs text-gray-500">{t('loginWhatsappNote')}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('loading') : t('sendLoginOtp')}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            {t('noAccount')}{' '}
            <Link to="/auth/register" className="font-semibold text-brand-500 hover:text-brand-600">
              {t('register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
