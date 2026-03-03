import { AnimatePresence, motion } from 'framer-motion'
import {
    ArrowUpDown,
    ChevronDown,
    ChevronRight,
    Download,
    LayoutGrid,
    List,
    Plus,
    RotateCcw,
    SlidersHorizontal,
    Upload,
} from 'lucide-react'
import { useMemo } from 'react'
import Button from '../../../components/ui/Button'
import FilterChip from '../../../components/ui/FilterChip'
import SearchInput from '../../../components/ui/SearchInput'
import type { Environment, ServiceType } from '../types'
import {
    ENVIRONMENT_COLORS,
    ENVIRONMENTS,
    SERVICE_TYPE_LABELS,
    SERVICE_TYPES,
} from '../types'
import type { ViewMode } from './ServiceGrid'
import ServiceTypeIcon from './ServiceTypeIcon'

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'name-asc'
  | 'name-desc'
  | 'service-type'
  | 'environment'
  | 'region'

export const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest First',
  oldest: 'Oldest First',
  'name-asc': 'Name A-Z',
  'name-desc': 'Name Z-A',
  'service-type': 'Service Type',
  environment: 'Environment',
  region: 'Region',
}

const ENV_CHIP_COLORS: Record<Environment, string> = {
  prod: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  staging: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  dev: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
}

const SERVICE_CHIP_COLORS: Record<ServiceType, string> = {
  lambda: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  'elastic-beanstalk': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cloudwatch: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  s3: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  ecs: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  rds: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'api-gateway': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  dynamodb: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  sqs: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  sns: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  ec2: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  other: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
}

interface ServiceFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  serviceTypeFilter: ServiceType | ''
  onServiceTypeChange: (value: ServiceType | '') => void
  environmentFilter: Environment | ''
  onEnvironmentChange: (value: Environment | '') => void
  regionFilter: string
  onRegionChange: (value: string) => void
  availableRegions: string[]
  onAdd: () => void
  onExport: () => void
  onImport: () => void
  totalCount: number
  filteredCount: number
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  filtersOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
}

export default function ServiceFilterBar({
  search,
  onSearchChange,
  serviceTypeFilter,
  onServiceTypeChange,
  environmentFilter,
  onEnvironmentChange,
  regionFilter,
  onRegionChange,
  availableRegions,
  onAdd,
  onExport,
  onImport,
  totalCount,
  filteredCount,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  filtersOpen,
  onFiltersOpenChange,
}: ServiceFilterBarProps) {
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (serviceTypeFilter) count++
    if (environmentFilter) count++
    if (regionFilter) count++
    return count
  }, [serviceTypeFilter, environmentFilter, regionFilter])

  function clearAllFilters() {
    onSearchChange('')
    onServiceTypeChange('')
    onEnvironmentChange('')
    onRegionChange('')
  }

  const selectClasses =
    'h-8 rounded-lg border border-surface-600 bg-surface-800 pl-2.5 pr-7 text-xs text-slate-300 outline-none transition-colors focus:border-amber-accent/50 cursor-pointer appearance-none'

  return (
    <div className="space-y-3">
      {/* Row 1: Title + Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-100">AWS Services</h1>
          <div className="flex items-center gap-1.5 rounded-full bg-surface-800 px-2.5 py-1 border border-surface-700">
            <span className="font-mono text-xs font-medium text-slate-300">
              {filteredCount}
            </span>
            {filteredCount !== totalCount && (
              <span className="font-mono text-xs text-slate-500">
                / {totalCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-surface-600 bg-surface-800 p-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-surface-600 text-amber-accent'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-surface-600 text-amber-accent'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="h-5 w-px bg-surface-700" />
          <Button variant="ghost" size="sm" onClick={onImport}>
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
          <Button variant="ghost" size="sm" onClick={onExport} disabled={totalCount === 0}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Row 2: Search + Filter toggle + Sort */}
      <div className="flex items-center gap-2">
        <div className="w-72">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Search by name, tag, type, region..."
          />
        </div>

        <button
          onClick={() => onFiltersOpenChange(!filtersOpen)}
          className={`relative inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all cursor-pointer ${
            filtersOpen || activeFilterCount > 0
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              : 'border-surface-600 bg-surface-800 text-slate-400 hover:border-surface-500 hover:text-slate-300'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/30 px-1 text-[10px] font-bold text-amber-300">
              {activeFilterCount}
            </span>
          )}
          <motion.span
            animate={{ rotate: filtersOpen ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="h-3 w-3" />
          </motion.span>
        </button>

        <AnimatePresence>
          {activeFilterCount > 0 && !filtersOpen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-300 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Clear
            </motion.button>
          )}
        </AnimatePresence>

        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className={selectClasses}
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Row 3: Collapsible filter panel */}
      <AnimatePresence initial={false}>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-surface-700 bg-surface-900/50 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  Filter by
                </span>
                <AnimatePresence>
                  {activeFilterCount > 0 && (
                    <motion.button
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onClick={clearAllFilters}
                      className="flex items-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-300 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Clear all
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Service Type chips */}
              <div>
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  Service Type
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_TYPES.map((type) => (
                    <FilterChip
                      key={type}
                      active={serviceTypeFilter === type}
                      onClick={() =>
                        onServiceTypeChange(serviceTypeFilter === type ? '' : type)
                      }
                      colorClass={SERVICE_CHIP_COLORS[type]}
                    >
                      <ServiceTypeIcon type={type} className="h-3 w-3" />
                      {SERVICE_TYPE_LABELS[type]}
                    </FilterChip>
                  ))}
                </div>
              </div>

              {/* Environment + Region chips */}
              <div className="flex items-start gap-8">
                <div>
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                    Environment
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ENVIRONMENTS.map((env) => (
                      <FilterChip
                        key={env}
                        active={environmentFilter === env}
                        onClick={() =>
                          onEnvironmentChange(environmentFilter === env ? '' : env)
                        }
                        colorClass={ENV_CHIP_COLORS[env]}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            ENVIRONMENT_COLORS[env] === 'green'
                              ? 'bg-emerald-400'
                              : ENVIRONMENT_COLORS[env] === 'amber'
                                ? 'bg-amber-400'
                                : 'bg-blue-400'
                          }`}
                        />
                        {env.charAt(0).toUpperCase() + env.slice(1)}
                      </FilterChip>
                    ))}
                  </div>
                </div>

                {availableRegions.length > 0 && (
                  <div>
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                      Region
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableRegions.map((region) => (
                        <FilterChip
                          key={region}
                          active={regionFilter === region}
                          onClick={() =>
                            onRegionChange(regionFilter === region ? '' : region)
                          }
                        >
                          <span className="font-mono">{region}</span>
                        </FilterChip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
