import client from './client';
import type {
  Company, CompanyContact, CustomerCard, LinkCompanyPayload,
  LinkCustomerPayload, CustomerLinkTestResult, CustomerLinkResult,
  CompanyFinancial, AccountStatement, StatementQuery,
  StatementInvoiceDetail, StatementPaymentDetail,
} from '@/types';

export const companiesApi = {
  list: (search?: string) =>
    client.get<Company[]>('/api/store/companies', { params: { search } }).then((r) => r.data),

  getContact: (companyCode: string) =>
    client.get<CompanyContact>(`/api/store/companies/${companyCode}/contact`).then((r) => r.data),

  resolveHost: (host: string) =>
    client.get<Company>('/api/store/resolve-host', { params: { host } }).then((r) => r.data),

  myCards: () =>
    client.get<CustomerCard[]>('/api/store/my-companies').then((r) => r.data),

  linkCompany: (data: LinkCompanyPayload) =>
    client.post('/api/store/my-companies/link', data).then((r) => r.data),

  testCustomerLink: (data: LinkCustomerPayload) =>
    client.post<CustomerLinkTestResult>('/api/store/my-companies/test-customer', data).then((r) => r.data),

  linkCustomer: (data: LinkCustomerPayload) =>
    client.post<CustomerLinkResult>('/api/store/my-companies/link-customer', data).then((r) => r.data),

  financials: () =>
    client.get<CompanyFinancial[]>('/api/store/my-companies/financials').then((r) => r.data),

  statement: (q: StatementQuery = {}) =>
    client.get<AccountStatement>('/api/store/my-companies/statement', {
      params: {
        companyCode: q.companyCode || undefined,
        from: q.from || undefined,
        to: q.to || undefined,
      },
    }).then((r) => r.data),

  statementInvoice: (companyCode: string, invoiceId: number) =>
    client.get<StatementInvoiceDetail>(
      `/api/store/my-companies/statement/invoices/${encodeURIComponent(companyCode)}/${invoiceId}`,
    ).then((r) => r.data),

  statementPayment: (companyCode: string, paymentId: number) =>
    client.get<StatementPaymentDetail>(
      `/api/store/my-companies/statement/payments/${encodeURIComponent(companyCode)}/${paymentId}`,
    ).then((r) => r.data),
};
