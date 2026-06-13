import { create } from 'zustand';
import { getCompanyCode } from '@/hooks/useCompany';
import type { Company } from '@/types';

interface CompanyStore {
  companyCode: string | null;      // null = multi-company mode (dev)
  companyInfo: Company | null;
  isResolvingHost: boolean;
  setCompanyCode: (code: string | null) => void;
  setCompanyInfo: (c: Company) => void;
  setResolvingHost: (v: boolean) => void;
}

export const useCompanyStore = create<CompanyStore>()((set) => ({
  companyCode: getCompanyCode(),
  companyInfo: null,
  isResolvingHost: false,
  setCompanyCode: (companyCode) => set({ companyCode }),
  setCompanyInfo: (c) => set({ companyInfo: c }),
  setResolvingHost: (isResolvingHost) => set({ isResolvingHost }),
}));
