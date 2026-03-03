import { Cloud, Plus } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { useServices } from '../hooks/useServices'
import type { Environment, ServiceEntry, ServiceEntryFormData, ServiceType } from '../types'
import { SERVICE_TYPE_LABELS } from '../types'
import DeleteConfirmModal from './DeleteConfirmModal'
import ServiceFilterBar, { type SortOption } from './ServiceFilterBar'
import ServiceFormModal from './ServiceFormModal'
import ServiceGrid, { type ViewMode } from './ServiceGrid'

const SEED_DATA: ServiceEntryFormData[] = [
  {
    name: 'order-processor',
    url: 'https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/order-processor',
    serviceType: 'lambda',
    region: 'us-east-1',
    environment: 'prod',
    tags: ['orders', 'critical'],
  },
  {
    name: 'user-api',
    url: 'https://console.aws.amazon.com/elasticbeanstalk/home?region=us-east-1#/environment/dashboard?environmentId=user-api-prod',
    serviceType: 'elastic-beanstalk',
    region: 'us-east-1',
    environment: 'prod',
    tags: ['api', 'users'],
  },
  {
    name: 'app-logs',
    url: 'https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups',
    serviceType: 'cloudwatch',
    region: 'us-east-1',
    environment: 'prod',
    tags: ['logs', 'monitoring'],
  },
  {
    name: 'payment-service-dev',
    url: 'https://console.aws.amazon.com/lambda/home?region=us-west-2#/functions/payment-service',
    serviceType: 'lambda',
    region: 'us-west-2',
    environment: 'dev',
    tags: ['payments'],
  },
  {
    name: 'static-assets',
    url: 'https://s3.console.aws.amazon.com/s3/buckets/static-assets-prod',
    serviceType: 's3',
    region: 'us-east-1',
    environment: 'prod',
    tags: ['cdn', 'frontend'],
  },
  {
    name: 'notification-queue',
    url: 'https://console.aws.amazon.com/sqs/v3/home?region=us-east-1#/queues/notification-queue',
    serviceType: 'sqs',
    region: 'us-east-1',
    environment: 'staging',
    tags: ['notifications', 'async'],
  },
]

export default function AWSLauncherPage() {
  const {
    services,
    addService,
    updateService,
    deleteService,
    duplicateService,
    importServices,
    exportServices,
    allTags,
    allRegions,
  } = useServices()

  const [search, setSearch] = useState('')
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | ''>('')
  const [environmentFilter, setEnvironmentFilter] = useState<Environment | ''>('')
  const [regionFilter, setRegionFilter] = useState('')
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('devutils-view-mode', 'grid')
  const [sortBy, setSortBy] = useLocalStorage<SortOption>('devutils-sort-by', 'newest')
  const [filtersOpen, setFiltersOpen] = useLocalStorage<boolean>('devutils-filters-open', false)

  const [formOpen, setFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ServiceEntry | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredServices = useMemo(() => {
    let result = services

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)) ||
          SERVICE_TYPE_LABELS[s.serviceType].toLowerCase().includes(q) ||
          s.region.toLowerCase().includes(q)
      )
    }

    if (serviceTypeFilter) {
      result = result.filter((s) => s.serviceType === serviceTypeFilter)
    }
    if (environmentFilter) {
      result = result.filter((s) => s.environment === environmentFilter)
    }
    if (regionFilter) {
      result = result.filter((s) => s.region === regionFilter)
    }

    const sorted = [...result]
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'service-type':
        sorted.sort((a, b) => SERVICE_TYPE_LABELS[a.serviceType].localeCompare(SERVICE_TYPE_LABELS[b.serviceType]))
        break
      case 'environment': {
        const envOrder = { prod: 0, staging: 1, dev: 2 }
        sorted.sort((a, b) => envOrder[a.environment] - envOrder[b.environment])
        break
      }
      case 'region':
        sorted.sort((a, b) => a.region.localeCompare(b.region))
        break
    }

    return sorted
  }, [services, search, serviceTypeFilter, environmentFilter, regionFilter, sortBy])

  function handleAdd() {
    setEditingService(null)
    setFormOpen(true)
  }

  function handleEdit(service: ServiceEntry) {
    setEditingService(service)
    setFormOpen(true)
  }

  function handleFormSubmit(data: ServiceEntryFormData) {
    if (editingService) {
      updateService(editingService.id, data)
    } else {
      addService(data)
    }
  }

  function handleExport() {
    const json = exportServices()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aws-services-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (Array.isArray(data)) {
          importServices(data)
        }
      } catch {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleSeedData() {
    SEED_DATA.forEach((entry) => addService(entry))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sticky header: filter bar */}
      <div className="shrink-0 border-b border-surface-700 bg-surface-950 px-6 pt-5 pb-4 lg:px-8">
        <ServiceFilterBar
          search={search}
          onSearchChange={setSearch}
          serviceTypeFilter={serviceTypeFilter}
          onServiceTypeChange={setServiceTypeFilter}
          environmentFilter={environmentFilter}
          onEnvironmentChange={setEnvironmentFilter}
          regionFilter={regionFilter}
          onRegionChange={setRegionFilter}
          availableRegions={allRegions}
          onAdd={handleAdd}
          onExport={handleExport}
          onImport={handleImport}
          totalCount={services.length}
          filteredCount={filteredServices.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filtersOpen={filtersOpen}
          onFiltersOpenChange={setFiltersOpen}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-6 py-5 lg:px-8">
        {services.length === 0 ? (
          <EmptyState
            icon={<Cloud className="h-8 w-8" />}
            title="No services yet"
            description="Add your AWS service URLs to quickly launch them from one place. No more digging through the AWS console."
            action={
              <div className="flex items-center gap-3">
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4" />
                  Add First Service
                </Button>
                <Button variant="secondary" onClick={handleSeedData}>
                  Load Sample Data
                </Button>
              </div>
            }
          />
        ) : filteredServices.length === 0 ? (
          <EmptyState
            icon={<Cloud className="h-8 w-8" />}
            title="No matches"
            description="Try adjusting your search or filters to find what you're looking for."
          />
        ) : (
          <ServiceGrid
            services={filteredServices}
            onEdit={handleEdit}
            onDuplicate={duplicateService}
            onDelete={(id) => {
              const svc = services.find((s) => s.id === id)
              if (svc) setDeleteTarget(svc)
            }}
            viewMode={viewMode}
          />
        )}
      </div>

      <ServiceFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        editingService={editingService}
        existingTags={allTags}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteService(deleteTarget.id)
        }}
        serviceName={deleteTarget?.name ?? ''}
      />
    </div>
  )
}
