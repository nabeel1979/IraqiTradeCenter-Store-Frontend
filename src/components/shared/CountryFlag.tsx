import { useState } from 'react';
import { cn } from '@/lib/utils';

type CountryFlagProps = {
  iso: string;
  className?: string;
};

/**
 * علَم الدولة كصورة (flagcdn) — يعمل على كل الأنظمة بما فيها ويندوز،
 * بخلاف رموز العلَم Emoji التي تظهر كحروف (مثل "IQ") على ويندوز.
 */
export function CountryFlag({ iso, className }: CountryFlagProps) {
  const [failed, setFailed] = useState(false);
  const code = iso.trim().toLowerCase();

  if (failed || code.length !== 2) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-sm bg-gray-100 text-[9px] font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-300',
          className ?? 'h-4 w-6',
        )}
      >
        {iso.toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={iso.toUpperCase()}
      width={24}
      height={18}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('shrink-0 rounded-sm object-cover', className ?? 'h-4 w-6')}
    />
  );
}
