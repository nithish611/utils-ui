export const SERVICE_TYPES = [
  'lambda',
  'elastic-beanstalk',
  'cloudwatch',
  's3',
  'ecs',
  'rds',
  'api-gateway',
  'dynamodb',
  'sqs',
  'sns',
  'ec2',
  'other',
] as const

export type ServiceType = (typeof SERVICE_TYPES)[number]

export const ENVIRONMENTS = ['dev', 'staging', 'prod'] as const
export type Environment = (typeof ENVIRONMENTS)[number]

export const AWS_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'sa-east-1',
  'ca-central-1',
] as const

export interface ServiceEntry {
  id: string
  name: string
  url: string
  serviceType: ServiceType
  region: string
  environment: Environment
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type ServiceEntryFormData = Omit<ServiceEntry, 'id' | 'createdAt' | 'updatedAt'>

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  lambda: 'Lambda',
  'elastic-beanstalk': 'Elastic Beanstalk',
  cloudwatch: 'CloudWatch',
  s3: 'S3',
  ecs: 'ECS',
  rds: 'RDS',
  'api-gateway': 'API Gateway',
  dynamodb: 'DynamoDB',
  sqs: 'SQS',
  sns: 'SNS',
  ec2: 'EC2',
  other: 'Other',
}

export const ENVIRONMENT_COLORS: Record<Environment, string> = {
  prod: 'green',
  staging: 'amber',
  dev: 'blue',
}

export const SERVICE_TYPE_COLORS: Record<ServiceType, {
  badge: string
  bg: string
  text: string
  btnBg: string
  btnBgHover: string
}> = {
  lambda: {
    badge: 'orange',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    btnBg: 'bg-orange-500/10',
    btnBgHover: 'hover:bg-orange-500/20',
  },
  'elastic-beanstalk': {
    badge: 'green',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    btnBg: 'bg-emerald-500/10',
    btnBgHover: 'hover:bg-emerald-500/20',
  },
  cloudwatch: {
    badge: 'purple',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    btnBg: 'bg-purple-500/10',
    btnBgHover: 'hover:bg-purple-500/20',
  },
  s3: {
    badge: 'teal',
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    btnBg: 'bg-teal-500/10',
    btnBgHover: 'hover:bg-teal-500/20',
  },
  ecs: {
    badge: 'sky',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    btnBg: 'bg-sky-500/10',
    btnBgHover: 'hover:bg-sky-500/20',
  },
  rds: {
    badge: 'blue',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    btnBg: 'bg-blue-500/10',
    btnBgHover: 'hover:bg-blue-500/20',
  },
  'api-gateway': {
    badge: 'indigo',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    btnBg: 'bg-indigo-500/10',
    btnBgHover: 'hover:bg-indigo-500/20',
  },
  dynamodb: {
    badge: 'cyan',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    btnBg: 'bg-cyan-500/10',
    btnBgHover: 'hover:bg-cyan-500/20',
  },
  sqs: {
    badge: 'pink',
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    btnBg: 'bg-pink-500/10',
    btnBgHover: 'hover:bg-pink-500/20',
  },
  sns: {
    badge: 'rose',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    btnBg: 'bg-rose-500/10',
    btnBgHover: 'hover:bg-rose-500/20',
  },
  ec2: {
    badge: 'amber',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    btnBg: 'bg-amber-500/10',
    btnBgHover: 'hover:bg-amber-500/20',
  },
  other: {
    badge: 'default',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    btnBg: 'bg-slate-500/10',
    btnBgHover: 'hover:bg-slate-500/20',
  },
}
