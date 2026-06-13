import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-brand-500', className)} />
  );
}
