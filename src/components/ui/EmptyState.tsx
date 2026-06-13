import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description && <p className="mb-4 text-sm text-gray-500">{description}</p>}
      {action}
    </div>
  );
}
