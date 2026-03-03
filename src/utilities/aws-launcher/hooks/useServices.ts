import { useCallback, useMemo } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import type { ServiceEntry, ServiceEntryFormData } from '../types'

const STORAGE_KEY = 'devutils-aws-services'

function generateId(): string {
  return crypto.randomUUID()
}

export function useServices() {
  const [services, setServices] = useLocalStorage<ServiceEntry[]>(STORAGE_KEY, [])

  const addService = useCallback(
    (data: ServiceEntryFormData): ServiceEntry => {
      const now = new Date().toISOString()
      const entry: ServiceEntry = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      }
      setServices((prev) => [entry, ...prev])
      return entry
    },
    [setServices]
  )

  const updateService = useCallback(
    (id: string, data: Partial<ServiceEntryFormData>) => {
      setServices((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, ...data, updatedAt: new Date().toISOString() }
            : s
        )
      )
    },
    [setServices]
  )

  const deleteService = useCallback(
    (id: string) => {
      setServices((prev) => prev.filter((s) => s.id !== id))
    },
    [setServices]
  )

  const duplicateService = useCallback(
    (id: string): ServiceEntry | undefined => {
      const source = services.find((s) => s.id === id)
      if (!source) return undefined
      const now = new Date().toISOString()
      const entry: ServiceEntry = {
        ...source,
        id: generateId(),
        name: `${source.name} (copy)`,
        createdAt: now,
        updatedAt: now,
      }
      setServices((prev) => [entry, ...prev])
      return entry
    },
    [services, setServices]
  )

  const importServices = useCallback(
    (entries: ServiceEntry[]) => {
      setServices((prev) => {
        const existingIds = new Set(prev.map((s) => s.id))
        const newEntries = entries.filter((e) => !existingIds.has(e.id))
        return [...newEntries, ...prev]
      })
    },
    [setServices]
  )

  const exportServices = useCallback((): string => {
    return JSON.stringify(services, null, 2)
  }, [services])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    services.forEach((s) => s.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [services])

  const allRegions = useMemo(() => {
    const regionSet = new Set<string>()
    services.forEach((s) => regionSet.add(s.region))
    return Array.from(regionSet).sort()
  }, [services])

  return {
    services,
    addService,
    updateService,
    deleteService,
    duplicateService,
    importServices,
    exportServices,
    setServices,
    allTags,
    allRegions,
  }
}
