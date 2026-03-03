import {
  Zap,
  Server,
  Eye,
  HardDrive,
  Container,
  Database,
  Globe,
  Table2,
  MessageSquare,
  Bell,
  Monitor,
  Box,
} from 'lucide-react'
import type { ServiceType } from '../types'

const iconMap: Record<ServiceType, typeof Zap> = {
  lambda: Zap,
  'elastic-beanstalk': Server,
  cloudwatch: Eye,
  s3: HardDrive,
  ecs: Container,
  rds: Database,
  'api-gateway': Globe,
  dynamodb: Table2,
  sqs: MessageSquare,
  sns: Bell,
  ec2: Monitor,
  other: Box,
}

interface ServiceTypeIconProps {
  type: ServiceType
  className?: string
}

export default function ServiceTypeIcon({ type, className = 'h-4 w-4' }: ServiceTypeIconProps) {
  const Icon = iconMap[type] || Box
  return <Icon className={className} />
}
