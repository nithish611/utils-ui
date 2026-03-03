import type { ServiceEntry } from '../types'
import ServiceCard from './ServiceCard'
import ServiceListItem from './ServiceListItem'

export type ViewMode = 'grid' | 'list'

interface ServiceGridProps {
  services: ServiceEntry[]
  onEdit: (service: ServiceEntry) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  viewMode: ViewMode
}

export default function ServiceGrid({
  services,
  onEdit,
  onDuplicate,
  onDelete,
  viewMode,
}: ServiceGridProps) {
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-2">
        {services.map((service, index) => (
          <ServiceListItem
            key={service.id}
            service={service}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            index={index}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {services.map((service, index) => (
        <ServiceCard
          key={service.id}
          service={service}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          index={index}
        />
      ))}
    </div>
  )
}
