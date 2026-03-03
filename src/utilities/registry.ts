import { type LucideIcon } from 'lucide-react'
import { type ComponentType } from 'react'

export interface UtilityModule {
  id: string
  name: string
  description: string
  icon: LucideIcon
  route: string
  component: ComponentType
  order?: number
}

const registry: UtilityModule[] = []

export function registerUtility(module: UtilityModule) {
  const exists = registry.find((m) => m.id === module.id)
  if (!exists) {
    registry.push(module)
  }
}

export function getUtilities(): UtilityModule[] {
  return [...registry].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}
