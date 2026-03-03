import { motion } from 'framer-motion'
import { Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import type { BadgeVariant } from '../../../components/ui/Badge'
import Badge from '../../../components/ui/Badge'
import type { ServiceEntry } from '../types'
import { ENVIRONMENT_COLORS, SERVICE_TYPE_COLORS, SERVICE_TYPE_LABELS } from '../types'
import ServiceTypeIcon from './ServiceTypeIcon'

interface ServiceListItemProps {
  service: ServiceEntry
  onEdit: (service: ServiceEntry) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  index: number
}

export default function ServiceListItem({
  service,
  onEdit,
  onDuplicate,
  onDelete,
  index,
}: ServiceListItemProps) {
  const envColor = ENVIRONMENT_COLORS[service.environment] as BadgeVariant
  const svcColor = SERVICE_TYPE_COLORS[service.serviceType]

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03, ease: 'easeOut' }}
      className="group flex items-center gap-4 rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 transition-all duration-150 hover:border-surface-600 hover:bg-surface-800/80"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${svcColor.bg} ${svcColor.text}`}>
        <ServiceTypeIcon type={service.serviceType} className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-mono text-sm font-semibold text-slate-100 truncate">
            {service.name}
          </h3>
          <Badge variant={svcColor.badge as BadgeVariant}>{SERVICE_TYPE_LABELS[service.serviceType]}</Badge>
          <Badge variant={envColor}>{service.environment}</Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-3">
          <span className="font-mono text-xs text-slate-500">{service.region}</span>
          {service.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {service.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-surface-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${svcColor.btnBg} ${svcColor.text} ${svcColor.btnBgHover}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Console
        </a>
        <button
          onClick={() => onEdit(service)}
          className="rounded-lg p-2 text-slate-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-700 hover:text-slate-300 cursor-pointer"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDuplicate(service.id)}
          className="rounded-lg p-2 text-slate-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-700 hover:text-slate-300 cursor-pointer"
          title="Duplicate"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(service.id)}
          className="rounded-lg p-2 text-slate-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}
