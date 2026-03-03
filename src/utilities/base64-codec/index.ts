import { FileCode } from 'lucide-react'
import { registerUtility } from '../registry'
import Base64Page from './components/Base64Page'

registerUtility({
  id: 'base64-codec',
  name: 'Base64',
  description: 'Encode and decode Base64 strings',
  icon: FileCode,
  route: '/base64',
  component: Base64Page,
  order: 6,
})
