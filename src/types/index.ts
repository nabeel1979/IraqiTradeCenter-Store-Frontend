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
  creditLimit: number;
  currentBalance: number;
  availableCredit?: number | null;
  lastActivity?: string | null;
  isActive: boolean;
}

export interface StatementLine {
  date: string;
  companyCode: string;
  companyName: string;
  docType: 'Invoice' | 'Payment';
  docNumber: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface AccountStatement {
  from: string;
  to: string;
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
  lines: StatementLine[];
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

export interface Order {
  id: string;
  orderNumber: string;
  companyCode: string;
  companyName: string;
  status: 'Pending' | 'Received' | 'InProcessing' | 'InvoiceIssued' | 'Shipping' | 'Delivered' | 'Rejected';
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitOfMeasureName: string;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
