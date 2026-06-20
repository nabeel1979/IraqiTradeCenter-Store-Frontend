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
  whatsappSent?: boolean;
  emailSent?: boolean;
  fallbackUsed?: boolean;
  deliveryNote?: string | null;
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
  fullName?: string;
  fullNameEn?: string;
  contactPhone?: string;
  businessName?: string;
  businessNameEn?: string;
  countryId?: number | null;
  cityId?: number | null;
  country?: string;
  city?: string;
  detailedAddress?: string;
  detailedAddressEn?: string;
  locationUrl?: string;
}

export interface StoreUserPhoto {
  id: string;
  fileName: string;
  contentType?: string | null;
  sizeBytes: number;
  createdAt: string;
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

  listPhotos: () =>
    client.get<{ data: StoreUserPhoto[] }>('/api/store/auth/photos').then((r) => r.data.data),

  uploadPhoto: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return client
      .post<{ data: StoreUserPhoto }>('/api/store/auth/photos', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);
  },

  deletePhoto: (id: string) =>
    client.delete(`/api/store/auth/photos/${id}`).then((r) => r.data),
};

export interface GeoCountry { id: number; code: string; nameAr: string; nameEn: string }
export interface GeoCity { id: number; countryId: number; nameAr: string; nameEn: string }

export const geographyApi = {
  countries: () =>
    client.get<{ data: GeoCountry[] }>('/api/store/geography/countries').then((r) => r.data.data),
  cities: (countryId?: number) =>
    client
      .get<{ data: GeoCity[] }>('/api/store/geography/cities', { params: countryId ? { countryId } : {} })
      .then((r) => r.data.data),
};
