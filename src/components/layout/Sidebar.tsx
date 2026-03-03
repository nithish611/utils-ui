import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PanelLeftClose, PanelLeft, Wrench } from 'lucide-react'
import { getUtilities } from '../../utilities/registry'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const utilities = getUtilities()

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-surface-700 bg-surface-900"
    >
      <div className="flex h-14 items-center gap-3 border-b border-surface-700 px-4">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 overflow-hidden"
          >
            <Wrench className="h-5 w-5 shrink-0 text-amber-accent" />
            <span className="font-mono text-sm font-semibold tracking-tight text-slate-100 whitespace-nowrap">
              DevUtils
            </span>
          </motion.div>
        )}
        {collapsed && (
          <Wrench className="h-5 w-5 mx-auto text-amber-accent" />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className={`mb-2 px-2 ${collapsed ? 'hidden' : ''}`}>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Utilities
          </span>
        </div>
        {utilities.map((util) => {
          const Icon = util.icon
          return (
            <NavLink
              key={util.id}
              to={util.route}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 mb-0.5 ${
                  isActive
                    ? 'bg-amber-accent/10 text-amber-accent'
                    : 'text-slate-400 hover:bg-surface-800 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {util.name}
                </motion.span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={onToggle}
        className="flex h-12 items-center justify-center border-t border-surface-700 text-slate-500 transition-colors hover:text-slate-300"
      >
        {collapsed ? (
          <PanelLeft className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </button>
    </motion.aside>
  )
}
