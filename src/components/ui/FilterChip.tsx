import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface FilterChipProps {
  active: boolean
  onClick: () => void
  children: ReactNode
  colorClass?: string
}

export default function FilterChip({ active, onClick, children, colorClass }: FilterChipProps) {
  const baseClasses =
    'relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer select-none border transition-all duration-150'

  const activeClasses = colorClass
    ? colorClass
    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'

  const inactiveClasses =
    'bg-transparent text-slate-400 border-surface-600 hover:border-surface-500 hover:text-slate-300 hover:bg-surface-800/50'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
    >
      <AnimatePresence>
        {active && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-surface-900"
          />
        )}
      </AnimatePresence>
      {children}
    </motion.button>
  )
}
