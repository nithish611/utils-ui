import { Cloud } from 'lucide-react'
import { registerUtility } from '../registry'
import AWSLauncherPage from './components/AWSLauncherPage'

registerUtility({
  id: 'aws-launcher',
  name: 'AWS Launcher',
  description: 'Quick-launch AWS console services',
  icon: Cloud,
  route: '/aws-launcher',
  component: AWSLauncherPage,
    order: 1,
})
