import { Badge } from '@/components/ui/badge'
import { Clock, Play, AlertCircle, CheckCircle } from 'lucide-react'

export const formatCurrency = (amount: number | null | undefined) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount ?? 0)
}

export const formatDuration = (milliseconds?: number | null) => {
  if (!milliseconds || milliseconds <= 0) {
    return null
  }

  const totalSeconds = Math.round(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
  }

  return `${seconds}s`
}

export const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'secondary' as const
    case 'IN_PROGRESS':
      return 'default' as const
    case 'REVIEW':
      return 'outline' as const
    case 'APPROVED':
    case 'COMPLETED':
      return 'default' as const
    case 'CANCELLED':
    case 'FAILED':
      return 'destructive' as const
    default:
      return 'secondary' as const
  }
}

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return <Clock className="h-4 w-4" />
    case 'IN_PROGRESS':
      return <Play className="h-4 w-4" />
    case 'REVIEW':
      return <AlertCircle className="h-4 w-4" />
    case 'APPROVED':
    case 'COMPLETED':
      return <CheckCircle className="h-4 w-4" />
    case 'CANCELLED':
    case 'FAILED':
      return <AlertCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const getPaymentStatusMeta = (status?: string) => {
  if (!status) return null
  switch (status) {
    case 'COMPLETED':
      return { label: 'Paid', className: 'bg-green-100 text-green-700 border-green-200' }
    case 'FAILED':
      return { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-200' }
    case 'INITIATED':
      return { label: 'Initiated', className: 'bg-amber-100 text-amber-700 border-amber-200' }
    case 'PENDING':
      return { label: 'Pending', className: 'bg-slate-100 text-slate-700 border-slate-200' }
    case 'NO_PAYOUT_REQUIRED':
      return {
        label: 'Logical payout (no transfer)',
        className: 'bg-slate-100 text-slate-800 border-slate-300'
      }
    default:
      return {
        label: toTitleCase(status.replace(/_/g, ' ')),
        className: 'bg-slate-100 text-slate-700 border-slate-200'
      }
  }
}

export const formatPaymentStatus = (status?: string) => getPaymentStatusMeta(status)?.label ?? 'Unknown status'

export const renderPaymentStatusBadge = (status?: string) => {
  const meta = getPaymentStatusMeta(status)
  if (!meta) return null
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}

type PayrollPayoutStatus =
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'INITIATED'
  | 'FAILED'
  | 'NOT_STARTED'

const getPayoutStatusMeta = (status?: string) => {
  const normalized = (status as PayrollPayoutStatus | undefined) ?? 'NOT_STARTED'

  switch (normalized) {
    case 'COMPLETED':
      return { label: 'Payout Complete', className: 'bg-green-100 text-green-700 border-green-200' }
    case 'IN_PROGRESS':
      return { label: 'Payout In Progress', className: 'bg-blue-100 text-blue-700 border-blue-200' }
    case 'INITIATED':
      return { label: 'Payout Initiated', className: 'bg-amber-100 text-amber-700 border-amber-200' }
    case 'FAILED':
      return { label: 'Payout Failed', className: 'bg-red-100 text-red-700 border-red-200' }
    case 'NOT_STARTED':
    default:
      return { label: 'Not Started', className: 'bg-slate-100 text-slate-700 border-slate-200' }
  }
}

export const renderPayoutStatusBadge = (status?: string) => {
  const meta = getPayoutStatusMeta(status)
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}
