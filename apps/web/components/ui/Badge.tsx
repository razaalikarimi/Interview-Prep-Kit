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
  default: 'bg-slate-800 text-slate-300 border-slate-700',
  queued: 'badge-queued',
  running: 'badge-running',
  completed: 'badge-completed',
  partial: 'badge-partial',
  failed: 'badge-failed',
  must: 'bg-red-500/10 text-red-400 border-red-500/20 font-semibold',
  nice: 'bg-slate-800/80 text-slate-400 border-slate-700',
  easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  hard: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  technical: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  behavioural: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'system-design': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'company-fit': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  domain: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
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
