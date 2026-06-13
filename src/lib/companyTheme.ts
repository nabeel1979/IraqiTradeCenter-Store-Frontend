/** لوحة الشركات — ذهبي فاتح (مطابقة لـ theme-company في تطبيق الشركات) */

export const COMPANY_BRAND = {

  50: '#f9f7f4',

  100: '#f0ebe3',

  200: '#e5d9c8',

  300: '#d4bc94',

  400: '#c4a063',

  500: '#b08840',

  600: '#92742f',

  700: '#785f26',

  800: '#5e4b1e',

  900: '#4a3b18',

  950: '#2e2410',

} as const;



export const COMPANY_SURFACE = {

  DEFAULT: '#e0dad0',

  card: '#f9f7f4',

} as const;



/** يُفعّل تدرجات أقوى عند فتح متجر شركة محددة */

export function applyCompanyStoreTheme(active: boolean) {

  document.documentElement.classList.toggle('theme-company-store', active);



  const meta = document.querySelector('meta[name="theme-color"]');

  if (meta) meta.setAttribute('content', COMPANY_BRAND[500]);

}

