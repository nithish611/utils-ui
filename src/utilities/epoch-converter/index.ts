import { Clock } from 'lucide-react'
import { registerUtility } from '../registry'
import EpochPage from './components/EpochPage'

registerUtility({
  id: 'epoch-converter',
  name: 'Epoch Converter',
  description: 'Convert between epoch timestamps and dates',
  icon: Clock,
  route: '/epoch',
  component: EpochPage,
  order: 4,
})
