import { motion } from 'framer-motion'
import { Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import type { BadgeVariant } from '../../../components/ui/Badge'
import Badge from '../../../components/ui/Badge'
import type { ServiceEntry } from '../types'
import { ENVIRONMENT_COLORS, SERVICE_TYPE_COLORS, SERVICE_TYPE_LABELS } from '../types'
import ServiceTypeIcon from './ServiceTypeIcon'

interface ServiceCardProps {
  service: ServiceEntry
  onEdit: (service: ServiceEntry) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  index: number
}

export default function ServiceCard({
  service,
  onEdit,
  onDuplicate,
  onDelete,
  index,
}: ServiceCardProps) {
  const envColor = ENVIRONMENT_COLORS[service.environment] as BadgeVariant
  const svcColor = SERVICE_TYPE_COLORS[service.serviceType]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
      className="noise-bg group relative flex flex-col rounded-xl border border-surface-700 bg-surface-800 p-4 transition-all duration-200 hover:border-surface-600 hover:shadow-lg hover:shadow-black/20"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${svcColor.bg} ${svcColor.text}`}>
            <ServiceTypeIcon type={service.serviceType} className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-mono text-sm font-semibold text-slate-100 truncate">
              {service.name}
            </h3>
            <Badge variant={svcColor.badge as BadgeVariant} className="mt-0.5">
              {SERVICE_TYPE_LABELS[service.serviceType]}
            </Badge>
          </div>
        </div>
        <Badge variant={envColor}>{service.environment}</Badge>
      </div>

      <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
        <span className="font-mono">{service.region}</span>
      </div>

      {service.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
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

      <div className="mt-auto flex items-center gap-1.5 pt-2 border-t border-surface-700">
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${svcColor.btnBg} ${svcColor.text} ${svcColor.btnBgHover}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Console
        </a>
        <button
          onClick={() => onEdit(service)}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-surface-700 hover:text-slate-300 cursor-pointer"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDuplicate(service.id)}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-surface-700 hover:text-slate-300 cursor-pointer"
          title="Duplicate"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(service.id)}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}
