import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Link2, CheckCircle2, ChevronDown, ChevronUp,
  UserCheck, FlaskConical, Copy, Send,
} from 'lucide-react';
import { companiesApi } from '@/api/companies';
import { useAuthStore } from '@/store/authStore';
import { useCompanyStore } from '@/store/companyStore';
import type { CustomerLinkTestResult } from '@/types';
import { formatNumber } from '@/lib/utils';

const PRIVILEGE_KEYS = [
  'creditSales', 'customPrices', 'accountStatements',
  'reports', 'invoiceEmail', 'invoiceWhatsapp',
] as const;

export function LinkCompany() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { companyCode: fixedCompany, companyInfo } = useCompanyStore();
  const queryClient = useQueryClient();

  /* ── Send-request state (main flow) ── */
  const [reqCompanyCode, setReqCompanyCode] = useState(fixedCompany ?? '');
  const [sent, setSent] = useState(false);

  /* ── Customer-code advanced section ── */
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advCompanyCode, setAdvCompanyCode] = useState(fixedCompany ?? '');
  const [customerCode, setCustomerCode] = useState('');
  const [testResult, setTestResult] = useState<CustomerLinkTestResult | null>(null);

  useEffect(() => {
    if (fixedCompany) {
      setReqCompanyCode(fixedCompany);
      setAdvCompanyCode(fixedCompany);
    }
  }, [fixedCompany]);

  useEffect(() => { setTestResult(null); }, [advCompanyCode, customerCode]);

  /* ── Mutation: send link request ── */
  const { mutate: sendRequest, isPending: sending } = useMutation({
    mutationFn: () =>
      companiesApi.linkCompany({
        companyCode: reqCompanyCode.trim().toUpperCase(),
        userCode: user!.userCode,
      }),
    onSuccess: () => {
      toast.success(t('linkRequestSent'));
      setSent(true);
      if (!fixedCompany) setReqCompanyCode('');
      queryClient.invalidateQueries({ queryKey: ['my-cards'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('error'));
    },
  });

  /* ── Mutation: test customer code ── */
  const { mutate: testLink, isPending: testing } = useMutation({
    mutationFn: () =>
      companiesApi.testCustomerLink({
        companyCode: advCompanyCode.trim().toUpperCase(),
        customerCode: customerCode.trim(),
      }),
    onSuccess: (res) => {
      setTestResult(res);
      if (res.linkedToYou) toast.success(t('customerAlreadyLinked'));
      else if (res.canLink) toast.success(t('customerTestSuccess'));
      else if (res.linkedToOther) toast.error(t('customerLinkedOther'));
      else if (!res.isActive) toast.error(t('customerInactive'));
    },
    onError: (err: unknown) => {
      setTestResult(null);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('customerNotFound'));
    },
  });

  /* ── Mutation: link customer code ── */
  const { mutate: linkCustomer, isPending: linkingCustomer } = useMutation({
    mutationFn: () =>
      companiesApi.linkCustomer({
        companyCode: advCompanyCode.trim().toUpperCase(),
        customerCode: customerCode.trim(),
      }),
    onSuccess: (res) => {
      toast.success(res.message ?? t('customerLinkSuccess'));
      setTestResult(null);
      setCustomerCode('');
      queryClient.invalidateQueries({ queryKey: ['my-cards'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('error'));
    },
  });

  const handleSendRequest = () => {
    if (!reqCompanyCode.trim()) {
      toast.error(t('enterCompanyCode'));
      return;
    }
    setSent(false);
    sendRequest();
  };

  const copyUserCode = () => {
    if (user?.userCode) {
      navigator.clipboard.writeText(user.userCode).then(() =>
        toast.success(t('copied') ?? 'تم النسخ')
      );
    }
  };

  return (
    <div className="max-w-md space-y-4">

      {/* ── Main card: request to open financial account ── */}
      <div className="card p-5">
        {/* Title */}
        <div className="mb-4 flex items-center gap-2">
          <Send className="h-5 w-5 text-brand-500" />
          <h2 className="font-bold text-gray-900 dark:text-white">
            {t('sendLinkRequest')}
          </h2>
        </div>

        {/* User code display */}
        <div className="mb-5 rounded-xl bg-brand-50 p-4 dark:bg-brand-900/20">
          <p className="mb-1 text-xs text-brand-700 dark:text-brand-400">
            {t('yourUserCode')}
          </p>
          <div className="flex items-center justify-between gap-2">
            <code className="flex-1 font-mono text-lg font-bold text-brand-700 dark:text-brand-300 tracking-widest">
              {user?.userCode}
            </code>
            <button
              type="button"
              onClick={copyUserCode}
              title={t('copy')}
              className="flex items-center gap-1 rounded-lg bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-200 dark:bg-brand-800/40 dark:text-brand-300 dark:hover:bg-brand-800/60"
            >
              <Copy className="h-3.5 w-3.5" />
              {t('copy')}
            </button>
          </div>
          <p className="mt-2 text-xs text-brand-600/70 dark:text-brand-400/70">
            {t('userCodeHint')}
          </p>
        </div>

        {/* Company code input */}
        {fixedCompany ? (
          <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-800 dark:bg-brand-900/20">
            <p className="mb-1 text-xs text-gray-500">{t('companyLabel')}</p>
            <p className="font-bold text-brand-700 dark:text-brand-300">
              {companyInfo?.name ?? fixedCompany}
            </p>
            <p className="font-mono text-xs text-gray-400">{fixedCompany}</p>
          </div>
        ) : (
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('companyCode')}
            </label>
            <input
              value={reqCompanyCode}
              onChange={(e) => { setReqCompanyCode(e.target.value.toUpperCase()); setSent(false); }}
              className="input font-mono tracking-widest"
              placeholder="XXXXXXXX"
              maxLength={8}
              dir="ltr"
            />
          </div>
        )}

        {/* Send button / success */}
        {sent ? (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-green-700 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{t('linkPending')}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSendRequest}
            disabled={sending || !reqCompanyCode.trim()}
            className="btn-primary w-full gap-2"
          >
            <Send className="h-4 w-4" />
            {sending ? t('loading') : t('sendRequest')}
          </button>
        )}
      </div>

      {/* ── Advanced: link by customer code ── */}
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50"
        >
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-gray-400" />
            {t('advancedLinkCustomerId')}
          </div>
          {showAdvanced
            ? <ChevronUp className="h-4 w-4" />
            : <ChevronDown className="h-4 w-4" />}
        </button>

        {showAdvanced && (
          <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('customerPrivilegesHint')}
            </p>

            {!fixedCompany && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('companyCode')}
                </label>
                <input
                  value={advCompanyCode}
                  onChange={(e) => setAdvCompanyCode(e.target.value.toUpperCase())}
                  className="input font-mono tracking-widest"
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  dir="ltr"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('customerCode')}
              </label>
              <input
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                className="input font-mono"
                placeholder={t('customerCodePlaceholder')}
                dir="ltr"
              />
            </div>

            <button
              type="button"
              onClick={() => testLink()}
              disabled={testing || !advCompanyCode.trim() || !customerCode.trim()}
              className="btn-outline w-full gap-2"
            >
              <FlaskConical className="h-4 w-4" />
              {testing ? t('loading') : t('testCustomerLink')}
            </button>

            {testResult && (
              <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500">{t('customerFound')}</p>
                  <p className="font-bold text-gray-900 dark:text-white">{testResult.businessName}</p>
                  <p className="text-xs text-gray-500">{testResult.ownerName} · {testResult.phone}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                    <p className="text-xs text-gray-500">{t('creditLimit')}</p>
                    <p className="font-semibold num-display">{formatNumber(testResult.creditLimit)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                    <p className="text-xs text-gray-500">{t('currentBalance')}</p>
                    <p className="font-semibold num-display">{formatNumber(testResult.currentBalance)}</p>
                  </div>
                </div>
                <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  {PRIVILEGE_KEYS.map((key) => (
                    <li key={key} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {t(`privilege.${key}`)}
                    </li>
                  ))}
                </ul>
                {(testResult.canLink || testResult.linkedToYou) && (
                  <button
                    type="button"
                    onClick={() => linkCustomer()}
                    disabled={linkingCustomer}
                    className="btn-primary w-full gap-2"
                  >
                    <Link2 className="h-4 w-4" />
                    {linkingCustomer
                      ? t('loading')
                      : testResult.linkedToYou
                        ? t('customerRelink')
                        : t('linkCustomerNow')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
