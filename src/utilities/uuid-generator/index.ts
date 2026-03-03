import { Fingerprint } from 'lucide-react'
import { registerUtility } from '../registry'
import UuidPage from './components/UuidPage'

registerUtility({
  id: 'uuid-generator',
  name: 'UUID Generator',
  description: 'Generate UUIDs in various formats',
  icon: Fingerprint,
  route: '/uuid',
  component: UuidPage,
  order: 5,
})
