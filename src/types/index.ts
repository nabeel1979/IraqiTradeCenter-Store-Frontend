// ── Auth ─────────────────────────────────────────────────────────────────────

export type AccountType = 'Trader' | 'Company';

export interface StoreUser {
  id: string;
  userCode: string;          // 12-char alphanumeric
  fullName: string;
  phone: string;
  contactPhone?: string | null;
  email?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  detailedAddress?: string | null;
  accountType: AccountType;
  isVerified: boolean;
  isProfileCompleted?: boolean;
  contactLocked?: boolean;
  createdAt: string;
}

export interface AuthState {
  user: StoreUser | null;
  token: string | null;
}

// ── Company ──────────────────────────────────────────────────────────────────

export interface Company {
  id: number;
  companyCode: string;
  name: string;
  activity: string;
  address: string;
  logoUrl?: string;
  domain?: string;
}

export interface CompanyContact {
  name: string;
  email?: string | null;
  phones: string[];
  address?: string | null;
  about?: string | null;
  googleMapUrl?: string | null;
}

// ── Product ──────────────────────────────────────────────────────────────────

export interface UnitOfMeasure {
  id: number;
  name: string;
  nameEn: string;
}

export interface ItemCategory {
  id: number;
  name: string;
  nameEn?: string;
}

export interface ProductUnit {
  unitId: number;
  name: string;
  nameEn?: string;
  price: number;
  factorToBase: number;   // base units per 1 of this unit
  currency?: string;
  salePrices?: Partial<Record<number, number>>;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  unitOfMeasureId: number;
  unitOfMeasureName: string;
  unitOfMeasureNameEn?: string;
  sellingPrice: number;
  currency?: string;
  currentStock: number;
  imageUrl?: string;
  images?: string[];
  companyCode: string;
  companyName: string;
  showInStore: boolean;
  units?: ProductUnit[];
}

// ── Customer Card ─────────────────────────────────────────────────────────────

export interface CustomerCard {
  id: number;
  companyCode: string;
  companyName: string;
  customerCode: string;
  businessName: string;
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
  linkedAt: string;
}

// ── Financials (Wallet + Statement) ────────────────────────────────────────

export interface CompanyFinancial {
  companyCode: string;
  companyName: string;
  linked: boolean;
  customerCode?: string | null;
  businessName?: string | null;
  accountId?: number | null;
  accountCode?: string | null;
  accountName?: string | null;
  accountNameAr?: string | null;
  accountNameEn?: string | null;
  creditLimit: number;
  currentBalance: number;
  availableCredit?: number | null;
  lastActivity?: string | null;
  isActive: boolean;
  salesPriceType?: number | null;
}

export interface StatementLine {
  date: string;
  companyCode: string;
  companyName: string;
  docType: 'Invoice' | 'Payment';
  docId: number;
  docNumber: string;
  currency: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface StatementCurrencyBlock {
  currency: string;
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
  lines: StatementLine[];
}

export interface AccountStatement {
  from: string;
  to: string;
  blocks: StatementCurrencyBlock[];
}

export interface StatementInvoiceLine {
  itemName: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
  lineTotal: number;
}

export interface StatementInvoiceDetail {
  invoice: {
    id: number;
    invoiceNumber: string;
    invoiceDate: string;
    currency: string;
    subTotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    status: number;
    notes?: string | null;
    companyCode: string;
    companyName: string;
  };
  lines: StatementInvoiceLine[];
}

export interface StatementPaymentDetail {
  id: number;
  receiptNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string | null;
  notes?: string | null;
  salesInvoiceId?: number | null;
  invoiceNumber: string;
  currency: string;
  companyCode: string;
  companyName: string;
}

export interface StatementQuery {
  companyCode?: string | null;
  from?: string | null;
  to?: string | null;
}

export interface LinkCompanyPayload {
  companyCode: string;
  userCode: string;       // 12-char user ID sent to company
}

export interface LinkCustomerPayload {
  companyCode: string;
  customerCode: string;
}

export interface CustomerLinkTestResult {
  success: boolean;
  found: boolean;
  companyCode: string;
  companyName: string;
  customerCode: string;
  businessName: string;
  ownerName: string;
  phone: string;
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
  linkedToYou: boolean;
  linkedToOther: boolean;
  canLink: boolean;
  privileges: string[];
}

export interface CustomerLinkResult {
  success: boolean;
  message: string;
  companyCode: string;
  companyName: string;
  customerCode: string;
  businessName: string;
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
}

// ── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: number;
  productName: string;
  companyCode: string;
  companyName: string;
  unitOfMeasureId: number;
  unitOfMeasureName: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderSourceType = 'Order' | 'Invoice';

export type OrderStatus =
  | 'Pending' | 'Received' | 'InProcessing' | 'InvoiceIssued' | 'Shipping' | 'Delivered' | 'Rejected'
  | 'Issued' | 'PartiallyPaid' | 'Paid';

export interface Order {
  id: string;
  sourceType: OrderSourceType;
  orderNumber: string;
  companyCode: string;
  companyName: string;
  status: OrderStatus;
  totalAmount: number;
  currency?: string;
  createdAt: string;
  notes?: string | null;
  items: OrderItem[];
}

export interface OrderItem {
  productId?: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitOfMeasureName?: string | null;
  unitOfMeasureNameEn?: string | null;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
