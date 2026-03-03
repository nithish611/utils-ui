import { type ReactNode } from 'react'

export type BadgeVariant =
  | 'default'
  | 'amber'
  | 'teal'
  | 'green'
  | 'blue'
  | 'red'
  | 'purple'
  | 'orange'
  | 'cyan'
  | 'pink'
  | 'indigo'
  | 'lime'
  | 'sky'
  | 'rose'
  | 'yellow'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-700 text-slate-300',
  amber: 'bg-amber-500/15 text-amber-400',
  teal: 'bg-teal-500/15 text-teal-400',
  green: 'bg-emerald-500/15 text-emerald-400',
  blue: 'bg-blue-500/15 text-blue-400',
  red: 'bg-red-500/15 text-red-400',
  purple: 'bg-purple-500/15 text-purple-400',
  orange: 'bg-orange-500/15 text-orange-400',
  cyan: 'bg-cyan-500/15 text-cyan-400',
  pink: 'bg-pink-500/15 text-pink-400',
  indigo: 'bg-indigo-500/15 text-indigo-400',
  lime: 'bg-lime-500/15 text-lime-400',
  sky: 'bg-sky-500/15 text-sky-400',
  rose: 'bg-rose-500/15 text-rose-400',
  yellow: 'bg-yellow-500/15 text-yellow-400',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold font-mono uppercase tracking-wide ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
