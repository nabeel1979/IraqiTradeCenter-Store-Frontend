import client from './client';

interface Envelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface MyWallet {
  id: string;
  groupId?: string | null;
  groupName: string;
  walletType: number;
  walletTypeName: string;
  accountCode: string;
  name: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface WalletGroupOption {
  id: string;
  name: string;
  isMember: boolean;
}

export interface WalletTxn {
  id: string;
  walletId: string;
  type: number;
  typeName: string;
  isCredit: boolean;
  amount: number;
  balanceAfter: number;
  counterAccountCode?: string | null;
  counterAccountName?: string | null;
  counterpartyWalletId?: string | null;
  counterpartyName?: string | null;
  journalEntryId: number;
  description?: string | null;
  performedBy?: string | null;
  createdAt: string;
}

export interface ResolveRecipientResult {
  toWalletId: string;
  displayName: string;
  userCode: string;
  accountCode: string;
  walletType: number;
  walletTypeName: string;
}

export interface InitiateTransferResult {
  pendingTransferId: string;
  recipientName: string;
  recipientAccountCode: string;
  amount: number;
  currency: string;
  channel?: string | null;
  message?: string | null;
}

function unwrap<T>(env: Envelope<T>): T {
  if (!env.success || env.data === undefined) throw new Error(env.message ?? 'request failed');
  return env.data;
}

export const walletApi = {
  groups: () =>
    client.get<Envelope<WalletGroupOption[]>>('/api/store/wallet/groups').then((r) => unwrap(r.data)),

  accounts: () =>
    client.get<Envelope<MyWallet[]>>('/api/store/wallet/accounts').then((r) => unwrap(r.data)),

  openAccount: (groupId: string) =>
    client.post<Envelope<MyWallet[]>>('/api/store/wallet/accounts', { groupId }).then((r) => unwrap(r.data)),

  statement: (walletId: string, params?: { from?: string; to?: string; type?: number }) =>
    client
      .get<Envelope<WalletTxn[]>>(`/api/store/wallet/accounts/${walletId}/statement`, { params })
      .then((r) => unwrap(r.data)),

  resolveRecipient: (fromWalletId: string, code: string) =>
    client
      .post<Envelope<ResolveRecipientResult>>('/api/store/wallet/resolve-recipient', { fromWalletId, code })
      .then((r) => unwrap(r.data)),

  initiateTransfer: (body: {
    fromWalletId: string;
    recipientCode: string;
    amount: number;
    description?: string | null;
    channel?: string | null;
  }) =>
    client
      .post<Envelope<InitiateTransferResult>>('/api/store/wallet/transfer/initiate', body)
      .then((r) => unwrap(r.data)),

  confirmTransfer: (pendingTransferId: string, otp: string) =>
    client
      .post<Envelope<WalletTxn>>('/api/store/wallet/transfer/confirm', { pendingTransferId, otp })
      .then((r) => unwrap(r.data)),

  resendTransferOtp: (pendingTransferId: string, channel?: string | null) =>
    client
      .post<{ success: boolean; channel?: string; message?: string }>(
        '/api/store/wallet/transfer/resend-otp',
        { pendingTransferId, channel },
      )
      .then((r) => r.data),
};
