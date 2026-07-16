'use client';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-hrm-green-light', text: 'text-hrm-green', dot: 'bg-hrm-green' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  onboarding: { bg: 'bg-hrm-blue-light', text: 'text-hrm-blue', dot: 'bg-hrm-blue' },
  terminated: { bg: 'bg-hrm-red-light', text: 'text-hrm-red', dot: 'bg-hrm-red' },
  pending: { bg: 'bg-hrm-yellow-light', text: 'text-hrm-yellow', dot: 'bg-hrm-yellow' },
  paid: { bg: 'bg-hrm-green-light', text: 'text-hrm-green', dot: 'bg-hrm-green' },
  failed: { bg: 'bg-hrm-red-light', text: 'text-hrm-red', dot: 'bg-hrm-red' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const config = statusConfig[key] || statusConfig.inactive;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
}
