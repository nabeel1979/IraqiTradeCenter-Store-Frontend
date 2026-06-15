import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Wallet, Plus, Send, ListOrdered, X, ArrowDownCircle, ArrowUpCircle,
  CheckCircle2, Loader2, Copy, Check, Printer,
} from 'lucide-react';
import { walletApi, type MyWallet, type ResolveRecipientResult } from '@/api/wallet';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { formatAmount, formatDate, cn } from '@/lib/utils';

export function WalletDigital() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? 'ar-IQ' : 'en-US';
  const qc = useQueryClient();

  const [statementWallet, setStatementWallet] = useState<MyWallet | null>(null);
  const [sendWallet, setSendWallet] = useState<MyWallet | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyAccountCode = (w: MyWallet) => {
    navigator.clipboard.writeText(w.accountCode);
    setCopiedId(w.id);
    toast.success(t('accountCodeCopied'));
    setTimeout(() => setCopiedId((id) => (id === w.id ? null : id)), 2000);
  };

  const accountsQuery = useQuery({ queryKey: ['wallet-accounts'], queryFn: walletApi.accounts });
  const groupsQuery = useQuery({ queryKey: ['wallet-groups'], queryFn: walletApi.groups });

  const openMut = useMutation({
    mutationFn: (groupId: string) => walletApi.openAccount(groupId),
    onSuccess: () => {
      toast.success(t('accountOpened'));
      qc.invalidateQueries({ queryKey: ['wallet-accounts'] });
      qc.invalidateQueries({ queryKey: ['wallet-groups'] });
    },
    onError: (e: unknown) => toast.error(extractMsg(e) ?? t('error')),
  });

  const accounts = accountsQuery.data ?? [];
  const availableGroups = (groupsQuery.data ?? []).filter((g) => !g.isMember);

  if (accountsQuery.isLoading) {
    return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-4">
      {accounts.length === 0 ? (
        <EmptyState icon={Wallet} title={t('noWalletAccounts')} description={t('noWalletAccountsHint')} />
      ) : (
        <div className="space-y-3">
          <h3 className="px-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('walletAccounts')}</h3>
          {accounts.map((w) => (
            <div key={w.id} className="card overflow-hidden">
              <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-brand-400 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 opacity-90">
                    <Wallet className="h-5 w-5" />
                    <span className="text-sm font-medium">{w.groupName}</span>
                  </div>
                  <Badge variant={w.isActive ? 'success' : 'danger'}>
                    {w.isActive ? t('active') : t('inactive')}
                  </Badge>
                </div>
                <p className="mt-3 text-xs opacity-80">{t('walletBalance')}</p>
                <p className="num-display mt-1 text-3xl font-extrabold" dir="ltr">
                  {formatAmount(w.balance, w.currency)}
                </p>
                <button
                  type="button"
                  onClick={() => copyAccountCode(w)}
                  title={t('copyAccountCode')}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2 py-1 font-mono text-xs backdrop-blur transition hover:bg-white/25"
                  dir="ltr"
                >
                  {copiedId === w.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{w.accountCode}</span>
                </button>
              </div>
              <div className="flex gap-2 p-3">
                <button
                  type="button"
                  disabled={!w.isActive}
                  onClick={() => setSendWallet(w)}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {t('sendMoney')}
                </button>
                <button
                  type="button"
                  onClick={() => setStatementWallet(w)}
                  className="btn-outline flex-1"
                >
                  <ListOrdered className="h-4 w-4" />
                  {t('viewStatement')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {availableGroups.length > 0 && (
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('availableWallets')}</h3>
          <div className="space-y-2">
            {availableGroups.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">{g.name}</span>
                </div>
                <button
                  type="button"
                  disabled={openMut.isPending}
                  onClick={() => openMut.mutate(g.id)}
                  className="btn-primary text-sm"
                >
                  <Plus className="h-4 w-4" />
                  {t('openWalletAccount')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {statementWallet && (
        <StatementModal wallet={statementWallet} locale={locale} onClose={() => setStatementWallet(null)} />
      )}

      {sendWallet && (
        <SendMoneyModal
          wallet={sendWallet}
          onClose={() => setSendWallet(null)}
          onDone={() => {
            setSendWallet(null);
            qc.invalidateQueries({ queryKey: ['wallet-accounts'] });
          }}
        />
      )}
    </div>
  );
}

// ───────────────────────────── كشف الحركات ─────────────────────────────

function StatItem({ label, value, currency, tone }: { label: string; value: number; currency: string; tone?: 'in' | 'out' | 'balance' }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-800/40">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={cn(
        'num-display mt-0.5 truncate text-base font-bold',
        tone === 'in' && 'text-emerald-600 dark:text-emerald-400',
        tone === 'out' && 'text-rose-600 dark:text-rose-400',
        (!tone || tone === 'balance') && 'text-gray-900 dark:text-white',
      )} dir="ltr">
        {formatAmount(value, currency)}
      </p>
    </div>
  );
}

function StatementModal({ wallet, locale, onClose }: { wallet: MyWallet; locale: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['wallet-statement', wallet.id, from, to],
    queryFn: () => walletApi.statement(wallet.id, { from: from || undefined, to: to || undefined }),
  });

  // الحركات تأتي من الأحدث للأقدم؛ نعرض كشف الحساب بترتيب زمني تصاعدي مع رصيد جارٍ.
  const rows = useMemo(() => (data ? [...data].reverse() : []), [data]);

  const totals = useMemo(() => {
    const totalIn = rows.filter((r) => r.isCredit).reduce((s, r) => s + r.amount, 0);
    const totalOut = rows.filter((r) => !r.isCredit).reduce((s, r) => s + r.amount, 0);
    const closing = rows.length ? rows[rows.length - 1].balanceAfter : wallet.balance;
    const first = rows[0];
    const opening = first ? first.balanceAfter - (first.isCredit ? first.amount : -first.amount) : closing;
    return { totalIn, totalOut, closing, opening };
  }, [rows, wallet.balance]);

  const handlePrint = () => {
    const isAr = locale.startsWith('ar');
    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] ?? c));
    const rangeLabel = from || to
      ? `${from ? `${t('stmtFrom')}: ${from}` : ''} ${to ? `${t('stmtTo')}: ${to}` : ''}`.trim()
      : t('stmtAll');
    const body = rows.map((tx) => {
      const name = esc(tx.counterpartyName ?? tx.counterAccountName ?? '—');
      const desc = tx.description ? `<div class="muted">${esc(tx.description)}</div>` : '';
      return `<tr>
        <td>${formatDate(tx.createdAt, locale)}</td>
        <td class="mono">${esc(tx.counterAccountCode ?? '—')}</td>
        <td>${name}<div class="muted">${esc(tx.typeName)}</div>${desc}</td>
        <td class="num in">${tx.isCredit ? formatAmount(tx.amount, wallet.currency) : '—'}</td>
        <td class="num out">${!tx.isCredit ? formatAmount(tx.amount, wallet.currency) : '—'}</td>
        <td class="num bal">${formatAmount(tx.balanceAfter, wallet.currency)}</td>
      </tr>`;
    }).join('');

    const html = `<!doctype html><html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}"><head><meta charset="utf-8"/>
<title>${esc(t('walletStatementTitle'))}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#1f2937;margin:24px;font-size:12px}
  h1{font-size:18px;margin:0 0 2px}
  .sub{color:#6b7280;font-size:12px;margin:0 0 12px}
  .summary{display:flex;gap:8px;margin:12px 0}
  .box{flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:8px}
  .box .lbl{color:#6b7280;font-size:10px}
  .box .val{font-weight:700;font-size:14px;direction:ltr}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th,td{border:1px solid #e5e7eb;padding:6px 8px;text-align:${isAr ? 'right' : 'left'};vertical-align:top}
  th{background:#f9fafb;font-size:11px;color:#374151}
  .num{text-align:${isAr ? 'left' : 'right'};direction:ltr;white-space:nowrap}
  .mono{font-family:monospace;direction:ltr;text-align:${isAr ? 'right' : 'left'}}
  .muted{color:#9ca3af;font-size:10px;margin-top:2px}
  .in{color:#059669}.out{color:#dc2626}.bal{font-weight:700}
  @media print{body{margin:0}}
</style></head><body>
<h1>${esc(t('walletStatementTitle'))}</h1>
<p class="sub">${esc(wallet.groupName)} &middot; <span dir="ltr">${esc(wallet.accountCode)}</span> &middot; ${esc(rangeLabel)}</p>
<div class="summary">
  <div class="box"><div class="lbl">${esc(t('walletOpening'))}</div><div class="val">${formatAmount(totals.opening, wallet.currency)}</div></div>
  <div class="box"><div class="lbl">${esc(t('walletTotalIn'))}</div><div class="val" style="color:#059669">${formatAmount(totals.totalIn, wallet.currency)}</div></div>
  <div class="box"><div class="lbl">${esc(t('walletTotalOut'))}</div><div class="val" style="color:#dc2626">${formatAmount(totals.totalOut, wallet.currency)}</div></div>
  <div class="box"><div class="lbl">${esc(t('walletClosing'))}</div><div class="val">${formatAmount(totals.closing, wallet.currency)}</div></div>
</div>
<table>
  <thead><tr>
    <th>${esc(t('date'))}</th>
    <th>${esc(t('accountNumber'))}</th>
    <th>${esc(t('accountName'))}</th>
    <th>${esc(t('colIn'))}</th>
    <th>${esc(t('colOut'))}</th>
    <th>${esc(t('balance'))}</th>
  </tr></thead>
  <tbody>${body}</tbody>
</table>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl dark:bg-gray-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gradient-to-l from-brand-600 to-brand-500 px-4 py-3 text-white dark:border-gray-800">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold sm:text-lg">{t('walletStatementTitle')}</h2>
            <p className="truncate text-xs opacity-90">{wallet.groupName} · <span className="font-mono" dir="ltr">{wallet.accountCode}</span></p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrint}
              disabled={rows.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/25 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">{t('print')}</span>
            </button>
            <button onClick={onClose} className="rounded-lg p-1 text-white/90 hover:bg-white/15">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="flex-1 min-w-[8rem]">
            <label className="mb-1 block text-[11px] text-gray-500">{t('stmtFrom')}</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input py-2 text-sm" dir="ltr" />
          </div>
          <div className="flex-1 min-w-[8rem]">
            <label className="mb-1 block text-[11px] text-gray-500">{t('stmtTo')}</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input py-2 text-sm" dir="ltr" />
          </div>
          {(from || to) && (
            <button type="button" onClick={() => { setFrom(''); setTo(''); }} className="btn-outline py-2 text-sm">
              {t('stmtAll')}
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-2 px-4 py-3 lg:grid-cols-4">
          <StatItem label={t('walletOpening')} value={totals.opening} currency={wallet.currency} />
          <StatItem label={t('walletTotalIn')} value={totals.totalIn} currency={wallet.currency} tone="in" />
          <StatItem label={t('walletTotalOut')} value={totals.totalOut} currency={wallet.currency} tone="out" />
          <StatItem label={t('walletClosing')} value={totals.closing} currency={wallet.currency} tone="balance" />
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner className="h-7 w-7" /></div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">{t('noWalletTxns')}</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden rounded-xl border border-gray-100 dark:border-gray-800 sm:block">
                <table className="w-full table-fixed border-collapse text-xs [&_td]:border-t [&_td]:border-gray-100 dark:[&_td]:border-gray-800">
                  <colgroup>
                    <col style={{ width: '5rem' }} />
                    <col style={{ width: '6.5rem' }} />
                    <col />
                    <col style={{ width: '5rem' }} />
                    <col style={{ width: '5rem' }} />
                    <col style={{ width: '5.5rem' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 dark:bg-gray-800/40">
                      <th className="px-2 py-2.5 text-start font-medium">{t('date')}</th>
                      <th className="px-2 py-2.5 text-start font-medium">{t('accountNumber')}</th>
                      <th className="px-2 py-2.5 text-start font-medium">{t('accountName')}</th>
                      <th className="px-2 py-2.5 text-end font-medium">{t('colIn')}</th>
                      <th className="px-2 py-2.5 text-end font-medium">{t('colOut')}</th>
                      <th className="px-2 py-2.5 text-end font-medium">{t('balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((tx) => {
                      const counterparty = tx.counterpartyName ?? tx.counterAccountName ?? '—';
                      return (
                        <tr key={tx.id} className="align-top hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                          <td className="px-2 py-2.5 text-gray-600 dark:text-gray-300">{formatDate(tx.createdAt, locale)}</td>
                          <td className="px-2 py-2.5">
                            <span className="block break-all font-mono text-[11px] text-gray-700 dark:text-gray-300" dir="ltr">{tx.counterAccountCode ?? '—'}</span>
                          </td>
                          <td className="px-2 py-2.5 text-gray-700 dark:text-gray-300">
                            <span className="inline-flex items-center gap-1">
                              {tx.isCredit
                                ? <ArrowDownCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                : <ArrowUpCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />}
                              <span className="font-medium">{counterparty}</span>
                            </span>
                            <span className="block text-[10px] text-gray-400">{tx.typeName}</span>
                            {tx.description && <span className="block text-[10px] text-gray-400">{tx.description}</span>}
                          </td>
                          <td className="px-2 py-2.5 text-end text-emerald-600 dark:text-emerald-400">
                            <span className="num-display" dir="ltr">{tx.isCredit ? formatAmount(tx.amount, wallet.currency) : '—'}</span>
                          </td>
                          <td className="px-2 py-2.5 text-end text-rose-600 dark:text-rose-400">
                            <span className="num-display" dir="ltr">{!tx.isCredit ? formatAmount(tx.amount, wallet.currency) : '—'}</span>
                          </td>
                          <td className="px-2 py-2.5 text-end font-semibold text-gray-900 dark:text-white">
                            <span className="num-display" dir="ltr">{formatAmount(tx.balanceAfter, wallet.currency)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="space-y-2 sm:hidden">
                {[...rows].reverse().map((tx) => {
                  const counterparty = tx.counterpartyName ?? tx.counterAccountName ?? '—';
                  return (
                    <li key={tx.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                      <span className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        tx.isCredit ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/20',
                      )}>
                        {tx.isCredit ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{counterparty}</p>
                        {tx.counterAccountCode && (
                          <p className="truncate font-mono text-[11px] text-gray-500" dir="ltr">{tx.counterAccountCode}</p>
                        )}
                        <p className="truncate text-xs text-gray-500">{tx.typeName}</p>
                        {tx.description && <p className="truncate text-xs text-gray-400">{tx.description}</p>}
                        <p className="text-[11px] text-gray-400">{formatDate(tx.createdAt, locale)}</p>
                      </div>
                      <div className="text-end" dir="ltr">
                        <p className={cn('num-display text-sm font-bold', tx.isCredit ? 'text-emerald-600' : 'text-rose-600')}>
                          {tx.isCredit ? '+' : '-'}{formatAmount(tx.amount, wallet.currency)}
                        </p>
                        <p className="num-display text-[11px] text-gray-400">{formatAmount(tx.balanceAfter, wallet.currency)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────── إرسال أموال + OTP ─────────────────────────────

type SendStep = 'form' | 'otp';

function SendMoneyModal({ wallet, onClose, onDone }: { wallet: MyWallet; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();

  const [step, setStep] = useState<SendStep>('form');
  const [code, setCode] = useState('');
  const [recipient, setRecipient] = useState<ResolveRecipientResult | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [otpChannel, setOtpChannel] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const numericAmount = useMemo(() => Number(amount), [amount]);

  const verifyRecipient = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const res = await walletApi.resolveRecipient(wallet.id, code.trim());
      setRecipient(res);
    } catch (e) {
      setRecipient(null);
      toast.error(extractMsg(e) ?? t('recipientNotFound'));
    } finally {
      setBusy(false);
    }
  };

  const initiate = async () => {
    if (!recipient) { toast.error(t('recipientNotFound')); return; }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { toast.error(t('enterAmount')); return; }
    if (numericAmount > wallet.balance) { toast.error(t('insufficientBalance')); return; }
    setBusy(true);
    try {
      const res = await walletApi.initiateTransfer({
        fromWalletId: wallet.id,
        recipientCode: code.trim(),
        amount: numericAmount,
        description: description.trim() || null,
        channel,
      });
      setPendingId(res.pendingTransferId);
      setOtpChannel(res.channel ?? channel);
      setStep('otp');
      setResendTimer(60);
      toast.success(res.message ?? t('otpSent'));
    } catch (e) {
      toast.error(extractMsg(e) ?? t('error'));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!pendingId || otp.length < 6) { toast.error(t('otpIncomplete')); return; }
    setBusy(true);
    try {
      await walletApi.confirmTransfer(pendingId, otp);
      toast.success(t('transferSuccess'));
      onDone();
    } catch (e) {
      toast.error(extractMsg(e) ?? t('verifyError'));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!pendingId) return;
    try {
      const res = await walletApi.resendTransferOtp(pendingId, channel);
      if (res.channel) setOtpChannel(res.channel);
      setResendTimer(60);
      setOtp('');
      toast.success(res.message ?? t('resendSuccess'));
    } catch {
      toast.error(t('resendFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-brand-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {step === 'form' ? t('sendMoney') : t('confirmTransfer')}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
            <p className="text-xs text-gray-500">{t('transferFrom')}</p>
            <p className="font-medium text-gray-900 dark:text-white">{wallet.groupName}</p>
            <p className="num-display text-sm text-gray-500" dir="ltr">{formatAmount(wallet.balance, wallet.currency)}</p>
          </div>

          {step === 'form' ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('recipientCode')}</label>
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setRecipient(null); }}
                    placeholder={t('recipientCodeHint')}
                    className="input flex-1 font-mono"
                    dir="ltr"
                  />
                  <button type="button" onClick={verifyRecipient} disabled={busy || !code.trim()} className="btn-outline">
                    {t('verifyRecipient')}
                  </button>
                </div>
                {recipient && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">{recipient.displayName}</span>
                    <Badge variant="info">{recipient.walletTypeName}</Badge>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('amount')}</label>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input w-full"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('description')}</label>
                <input value={description} onChange={(e) => setDescription(e.target.value)} className="input w-full" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('otpChannel')}</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel('whatsapp')}
                    className={cn('flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium', channel === 'whatsapp' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700')}
                  >
                    {t('channelWhatsapp')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('email')}
                    className={cn('flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium', channel === 'email' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700')}
                  >
                    {t('channelEmail')}
                  </button>
                </div>
              </div>

              <button type="button" onClick={initiate} disabled={busy || !recipient} className="btn-primary w-full disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t('sendOtpAndTransfer')}
              </button>
            </>
          ) : (
            <>
              <div className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800/60">
                <div className="flex justify-between"><span className="text-gray-500">{t('recipient')}</span><span className="font-medium">{recipient?.displayName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('amount')}</span><span className="num-display font-bold" dir="ltr">{formatAmount(numericAmount, wallet.currency)}</span></div>
              </div>
              <p className="text-center text-sm text-gray-500">
                {t('enterOtpToConfirm')}
                {otpChannel ? ` (${otpChannel === 'whatsapp' ? t('channelWhatsapp') : t('channelEmail')})` : ''}
              </p>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="input w-full text-center text-2xl font-bold tracking-[0.5em]"
                dir="ltr"
              />
              <button type="button" onClick={confirm} disabled={busy || otp.length < 6} className="btn-primary w-full disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {t('confirmTransfer')}
              </button>
              <div className="text-center text-sm text-gray-500">
                {resendTimer > 0 ? (
                  <ResendCountdown seconds={resendTimer} onTick={setResendTimer} />
                ) : (
                  <button type="button" onClick={resend} className="font-semibold text-brand-500 hover:text-brand-600">
                    {t('resendOtp')}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResendCountdown({ seconds, onTick }: { seconds: number; onTick: (n: number) => void }) {
  const { t } = useTranslation();
  useEffect(() => {
    const id = setTimeout(() => onTick(seconds - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, onTick]);
  return <span>{t('resendIn', { seconds })}</span>;
}

function extractMsg(e: unknown): string | undefined {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
}
