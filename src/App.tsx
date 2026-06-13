import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import i18n from './i18n';
import { useCompanyStore } from './store/companyStore';
import { companiesApi } from './api/companies';
import { needsHostResolution } from './hooks/useCompany';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { CartPage } from './pages/CartPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyOtpPage } from './pages/auth/VerifyOtpPage';
import { CompleteProfilePage } from './pages/auth/CompleteProfilePage';
import { AccountPage } from './pages/account/AccountPage';
import { AccountProfile } from './pages/account/AccountProfile';
import { CustomerCards } from './pages/account/CustomerCards';
import { MyOrders } from './pages/account/MyOrders';
import { LinkCompany } from './pages/account/LinkCompany';
import { AccountWallet } from './pages/account/AccountWallet';
import { AccountStatement } from './pages/account/AccountStatement';
import { applyCompanyStoreTheme } from './lib/companyTheme';

function App() {
  const { companyCode, setCompanyInfo, setCompanyCode, setResolvingHost } = useCompanyStore();

  useEffect(() => {
    const lang = i18n.language;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    const savedTheme = localStorage.getItem('itc-theme');
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  // Resolve custom store domain → company code
  useEffect(() => {
    if (!needsHostResolution()) return;
    const host = window.location.hostname;
    setResolvingHost(true);
    companiesApi.resolveHost(host)
      .then((company) => {
        setCompanyCode(company.companyCode);
        setCompanyInfo(company);
        document.title = `${company.name} — المتجر`;
      })
      .catch(() => {})
      .finally(() => setResolvingHost(false));
  }, [setCompanyCode, setCompanyInfo, setResolvingHost]);

  // Load company info when running as a company-specific store
  useEffect(() => {
    if (!companyCode) return;
    companiesApi.list().then((list) => {
      const found = list.find((c) => c.companyCode === companyCode);
      if (found) {
        setCompanyInfo(found);
        document.title = `${found.name} — المتجر`;
      }
    }).catch(() => {});
  }, [companyCode, setCompanyInfo]);

  useEffect(() => {
    applyCompanyStoreTheme(!!companyCode);
  }, [companyCode]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        {/* Per-company store inside the main store: /store/{CODE} → company home */}
        <Route path="store/:code" element={<Navigate to="/" replace />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:companyCode/:id" element={<ProductDetailPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="cart" element={<CartPage />} />

        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/register" element={<RegisterPage />} />
        <Route path="auth/verify" element={<VerifyOtpPage />} />
        <Route path="auth/complete-profile" element={<CompleteProfilePage />} />

        <Route path="account" element={<AccountPage />}>
          <Route index element={<AccountProfile />} />
          <Route path="wallet" element={<AccountWallet />} />
          <Route path="statement" element={<AccountStatement />} />
          <Route path="cards" element={<CustomerCards />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="link" element={<LinkCompany />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
