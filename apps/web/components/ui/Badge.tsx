import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'queued'
  | 'running'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'must'
  | 'nice'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'technical'
  | 'behavioural'
  | 'system-design'
  | 'company-fit'
  | 'domain';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  queued: 'badge-queued',
  running: 'badge-running',
  completed: 'badge-completed',
  partial: 'badge-partial',
  failed: 'badge-failed',
  must: 'bg-red-50 text-red-700 border-red-200 font-semibold',
  nice: 'bg-gray-100 text-gray-600 border-gray-200',
  easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  hard: 'bg-rose-50 text-rose-700 border-rose-200',
  technical: 'bg-blue-50 text-blue-700 border-blue-200',
  behavioural: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'system-design': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'company-fit': 'bg-amber-50 text-amber-700 border-amber-200',
  domain: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const style = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${style} ${className}`}
    >
      {children}
    </span>
  );
}
