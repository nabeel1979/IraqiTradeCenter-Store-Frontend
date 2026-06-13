import client from './client';
import type { StoreUser, AccountType } from '@/types';

export type OtpPurpose = 'register' | 'login';

export type OtpChannel = 'whatsapp' | 'email';

export type LoginMethod = 'whatsapp' | 'email';

export interface OtpDeliveryConfig {
  channel: OtpChannel;
  requireEmailForRegister: boolean;
}

export interface OtpSendResponse {
  message: string;
  channel?: OtpChannel;
  emailHint?: string | null;
  phone?: string;
}

export interface LoginOtpPayload {
  method: LoginMethod;
  phone?: string;
  email?: string;
}

export interface RegisterStartPayload {
  method: LoginMethod;
  accountType: AccountType;
  phone?: string;
  email?: string;
}

export interface CompleteProfilePayload {
  fullName: string;
  contactPhone: string;
  email: string;
  country: string;
  city: string;
  address: string;
  detailedAddress: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
  purpose?: OtpPurpose;
}

export interface AuthResponse {
  token: string;
  user: StoreUser;
}

export const authApi = {
  getOtpDelivery: () =>
    client.get<OtpDeliveryConfig>('/api/store/auth/otp-delivery').then((r) => r.data),

  requestRegisterOtp: (data: RegisterStartPayload) =>
    client.post<OtpSendResponse>('/api/store/auth/request-register-otp', data).then((r) => r.data),

  requestLoginOtp: (data: LoginOtpPayload) =>
    client.post<OtpSendResponse>('/api/store/auth/request-login-otp', data).then((r) => r.data),

  verifyOtp: (data: VerifyOtpPayload) =>
    client.post<AuthResponse>('/api/store/auth/verify-otp', data).then((r) => r.data),

  completeProfile: (data: CompleteProfilePayload) =>
    client.post<AuthResponse>('/api/store/auth/complete-profile', data).then((r) => r.data),

  resendOtp: (phone: string, purpose?: OtpPurpose, method?: LoginMethod) =>
    client.post<OtpSendResponse>('/api/store/auth/resend-otp', { phone, purpose, method }).then((r) => r.data),

  me: () =>
    client.get<StoreUser>('/api/store/auth/me').then((r) => r.data),
};
