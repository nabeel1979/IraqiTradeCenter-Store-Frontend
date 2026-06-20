import { useState, useRef, useEffect } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import { toast } from 'sonner';

import { Mail, MessageCircle } from 'lucide-react';

import { authApi, type LoginMethod, type OtpPurpose } from '@/api/auth';
import { normalizePhoneForApi } from '@/lib/phone/normalize';

import { useAuthStore } from '@/store/authStore';



export function VerifyOtpPage() {

  const { t } = useTranslation();

  const navigate = useNavigate();

  const location = useLocation();

  const { setAuth } = useAuthStore();

  const {

    phone = '',

    email = '',

    purpose = 'register' as OtpPurpose,

    channel = 'email' as 'email' | 'whatsapp',

    loginMethod,

    registerMethod,
    accountType,

    deliveryMessage = '',
    deliveryNote = '',
    whatsappSent,
    emailSent,

  } = (location.state as {

    phone?: string;

    email?: string;

    purpose?: OtpPurpose;

    channel?: 'email' | 'whatsapp';

    loginMethod?: LoginMethod;

    registerMethod?: LoginMethod;
    accountType?: string;

    deliveryMessage?: string;
    deliveryNote?: string;
    whatsappSent?: boolean;
    emailSent?: boolean;

  }) ?? {};

  const isLogin = purpose === 'login';

  const otpMethod = isLogin ? loginMethod : registerMethod;

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));

  const [loading, setLoading] = useState(false);

  const [resendTimer, setResendTimer] = useState(60);

  const [activeChannel, setActiveChannel] = useState(channel);

  const [activeEmail, setActiveEmail] = useState(email);
  const [dualDelivery, setDualDelivery] = useState(Boolean(whatsappSent && emailSent));
  const [deliveryHint, setDeliveryHint] = useState(deliveryNote || deliveryMessage || '');

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const OTP_LEN = 6;

  const fillOtp = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, OTP_LEN);
    if (!digits) return;
    const next = Array(OTP_LEN).fill('');
    digits.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    const focusIdx = Math.min(digits.length, OTP_LEN) - 1;
    inputs.current[focusIdx]?.focus();
  };

  useEffect(() => {

    if (!phone) navigate(isLogin ? '/auth/login' : '/auth/register', { replace: true });

  }, [phone, navigate, isLogin]);



  useEffect(() => {

    if (resendTimer > 0) {

      const timer = setTimeout(() => setResendTimer((v) => v - 1), 1000);

      return () => clearTimeout(timer);

    }

  }, [resendTimer]);



  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) {
      fillOtp(value);
      return;
    }
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LEN - 1) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    fillOtp(e.clipboardData.getData('text'));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {

    if (e.key === 'Backspace' && !otp[index] && index > 0) {

      inputs.current[index - 1]?.focus();

    }

  };



  const apiPhone = normalizePhoneForApi(phone);

  const handleVerify = async () => {

    const code = otp.join('');

    if (code.length < 6) { toast.error(t('otpIncomplete')); return; }

    setLoading(true);

    try {

      const res = await authApi.verifyOtp({ phone: apiPhone, otp: code, purpose });

      setAuth(res.user, res.token);

      if (!isLogin) {
        toast.success(t('verifySuccess'));
        navigate('/auth/business-photos', {
          state: { accountType: accountType ?? res.user.accountType },
        });
        return;
      }

      if (res.user.isProfileCompleted === false) {
        toast.success(t('phoneVerified'));
        navigate('/auth/complete-profile');
        return;
      }

      toast.success(t('welcomeBack'));

      navigate('/');

    } catch (err: unknown) {

      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      toast.error(msg ?? t('verifyError'));

    } finally {

      setLoading(false);

    }

  };



  const handleResend = async () => {
    try {
      const res = await authApi.resendOtp(apiPhone, purpose, otpMethod);
      if (res.channel) setActiveChannel(res.channel);
      if (res.emailHint) setActiveEmail(res.emailHint);
      setDualDelivery(Boolean(res.whatsappSent && res.emailSent));
      setDeliveryHint(res.deliveryNote || (res.fallbackUsed ? (res.message ?? '') : ''));

      setResendTimer(60);
      setOtp(Array(6).fill(''));
      if (res.fallbackUsed) toast.warning(res.message ?? t('resendSuccess'));
      else if (res.whatsappSent && res.emailSent) toast.success(res.message ?? t('resendSuccess'));
      else toast.success(res.message ?? t('resendSuccess'));
    } catch {
      toast.error(t('resendFailed'));
    }
  };



  const showDual = dualDelivery || (activeChannel === 'whatsapp' && Boolean(activeEmail));
  const Icon = showDual || activeChannel === 'whatsapp' ? MessageCircle : Mail;
  const iconBg = showDual || activeChannel === 'whatsapp' ? 'bg-emerald-600' : 'bg-brand-500';



  return (

    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">

      <div className="w-full max-w-md">

        <div className="mb-8 text-center">

          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg}`}>

            <Icon className="h-7 w-7 text-white" />

          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">

            {isLogin ? t('enterOtp') : t('verifyAccount')}

          </h1>

          {deliveryHint && (
            <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {deliveryHint}
            </p>
          )}

          {showDual ? (
            <div className="mt-2 space-y-1 text-sm text-gray-500">
              <p>{t('otpSentDual')}</p>
              <p>
                {t('otpSentWhatsappLine')}:{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300 num-display" dir="ltr">{phone}</span>
              </p>
              <p>
                {t('otpSentEmailLine')}:{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300 num-display" dir="ltr">{activeEmail}</span>
              </p>
              <p className="text-xs">{t('otpCheckSpam')}</p>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-gray-500">
                {activeChannel === 'whatsapp' ? t('otpSentWhatsapp') : t('otpSentEmail')}{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300 num-display" dir="ltr">
                  {activeChannel === 'whatsapp' ? phone : activeEmail || phone}
                </span>
              </p>
              {(activeChannel === 'email' || dualDelivery) && (
                <p className="mt-1 text-xs text-gray-500">{t('otpCheckSpam')}</p>
              )}
            </>
          )}

        </div>



        <div className="card p-6">

          <div
            className="mb-6 flex justify-center gap-2 sm:gap-3"
            dir="ltr"
            onPaste={handlePaste}
          >
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => handleKeyDown(i, e)}

                className="h-12 w-10 rounded-xl border-2 border-gray-300 bg-white text-center text-lg font-bold text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:h-14 sm:w-12"

              />

            ))}

          </div>



          <button onClick={handleVerify} disabled={loading} className="btn-primary mb-4 w-full">

            {loading ? t('loading') : isLogin ? t('login') : t('verifyAccount')}

          </button>



          <div className="text-center text-sm text-gray-500">

            {resendTimer > 0 ? (

              <span>{t('resendIn', { seconds: resendTimer })}</span>

            ) : (

              <button onClick={handleResend} className="font-semibold text-brand-500 hover:text-brand-600">

                {t('resendOtp')}

              </button>

            )}

          </div>

        </div>

      </div>

    </div>

  );

}


