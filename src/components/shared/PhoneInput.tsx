import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  buildFullNumber,
  filterPhoneCountries,
  getCountryDisplayName,
  parsePhoneForInput,
  type PhoneCountry,
} from '@/lib/phone/countries';
import { detectDefaultCountryIso } from '@/lib/phone/detectCountry';
import { CountryFlag } from '@/components/shared/CountryFlag';

type PhoneInputProps = {
  value?: string;
  onChange: (fullDigits: string) => void;
  defaultCountryIso?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
};

function countryLabel(country: PhoneCountry, locale: string): string {
  return getCountryDisplayName(country.iso, locale);
}

export function PhoneInput({
  value = '',
  onChange,
  defaultCountryIso,
  className,
  disabled,
  id,
}: PhoneInputProps) {
  const { i18n, t } = useTranslation();
  const locale = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const rootRef = useRef<HTMLDivElement>(null);

  const resolvedDefaultIso = defaultCountryIso ?? detectDefaultCountryIso();

  const [country, setCountry] = useState<PhoneCountry>(
    () => parsePhoneForInput(value, resolvedDefaultIso).country,
  );
  const [national, setNational] = useState(
    () => parsePhoneForInput(value, resolvedDefaultIso).national,
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const parsed = parsePhoneForInput(value, resolvedDefaultIso);
    setCountry(parsed.country);
    setNational(parsed.national);
  }, [value, resolvedDefaultIso]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const emit = (c: PhoneCountry, n: string) => {
    onChange(buildFullNumber(c.dialCode, n));
  };

  const filtered = useMemo(() => filterPhoneCountries(query), [query]);

  const placeholder = country.iso === 'IQ' ? '7XXXXXXXXX' : t('phoneNumberPlaceholder');

  return (
    <div ref={rootRef} dir="ltr" className={cn('relative', className)}>
      <div
        className={cn(
          'flex h-11 flex-row overflow-hidden rounded-xl border-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900',
          'focus-within:border-brand-500',
          disabled && 'opacity-50',
        )}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(v => !v)}
          className="order-1 flex shrink-0 items-center gap-1 border-r border-gray-200 bg-gray-50 px-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <CountryFlag iso={country.iso} className="h-3.5 w-5" />
          <span className="font-medium" dir="ltr">
            {country.iso} +{country.dialCode}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>
        <input
          id={id}
          type="tel"
          dir="ltr"
          disabled={disabled}
          placeholder={placeholder}
          value={national}
          onChange={e => {
            const next = e.target.value.replace(/[^\d\s-]/g, '');
            setNational(next);
            emit(country, next);
          }}
          className="order-2 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      {open && (
        <div dir="ltr" className="absolute left-0 z-50 mt-1 w-full min-w-[280px] overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 p-2 dark:border-gray-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('phoneCountrySearch')}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.map(c => (
              <li key={c.iso}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800',
                    c.iso === country.iso && 'bg-brand-50 dark:bg-brand-900/20',
                  )}
                  onClick={() => {
                    setCountry(c);
                    setOpen(false);
                    setQuery('');
                    emit(c, national);
                  }}
                >
                  <CountryFlag iso={c.iso} className="h-4 w-6" />
                  <span className="min-w-[4.5rem] font-medium" dir="ltr">
                    {c.iso} +{c.dialCode}
                  </span>
                  <span className="truncate text-gray-500">{countryLabel(c, locale)}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-gray-500">{t('phoneCountryNoResults')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
