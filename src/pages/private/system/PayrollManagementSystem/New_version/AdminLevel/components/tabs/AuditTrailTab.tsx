import { useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  History,
  RefreshCcw,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { PayrollCycle, PayrollCycleDetails } from '../../../types/payroll'

type AuditPagination = {
  page: number
  totalPages: number
  total: number
  limit: number
}

type AuditTrailTabProps = {
  cycles: PayrollCycle[]
  pagination: AuditPagination
  isLoadingCycles: boolean
  cyclesError: string | null
  onPageChange: (page: number) => void | Promise<void>
  onReloadCycles: () => void | Promise<void>
  selectedCycleId: string | null
  onSelectCycle: (cycleId: string | null) => void
  cycleDetails: PayrollCycleDetails | null
  isLoadingDetails: boolean
  detailsError: string | null
  onRefreshCycle: () => void | Promise<void>
}

type AuditLogEntry = PayrollCycleDetails['auditLogs'][number]

type ParsedData = Record<string, unknown> | Array<unknown> | string | number | boolean | null

const MONTH_NAMES = Array.from({ length: 12 }, (_, index) =>
  new Date(2000, index).toLocaleString('default', { month: 'long' })
)

const formatCycleLabel = (cycle: PayrollCycle) => {
  const monthLabel = MONTH_NAMES[cycle.month - 1] ?? `Month ${cycle.month}`
  const statusLabel = cycle.status.replace(/_/g, ' ')
  return `${monthLabel} ${cycle.year} • ${statusLabel}`
}

const formatAction = (action: string) =>
  action
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const safeParse = (value: unknown): ParsedData => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  return value as ParsedData
}

const stringifyForSearch = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value.toLowerCase()
  }

  try {
    return JSON.stringify(value).toLowerCase()
  } catch {
    return String(value).toLowerCase()
  }
}

const prettyPrint = (value: unknown) => {
  if (value === null || value === undefined) {
    return '—'
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const getActorName = (log: AuditLogEntry) => {
  const parts = [log.user?.firstName, log.user?.lastName].filter(Boolean)
  return parts.length ? parts.join(' ') : null
}

const getChangedFields = (log: AuditLogEntry) => {
  const previous = safeParse(log.previousData)
  const next = safeParse(log.newData)

  if (!previous || !next) {
    return []
  }

  if (typeof previous !== 'object' || typeof next !== 'object') {
    return []
  }

  const prevRecord = previous as Record<string, unknown>
  const nextRecord = next as Record<string, unknown>
  const keys = new Set([...Object.keys(prevRecord), ...Object.keys(nextRecord)])

  const changed: string[] = []

  keys.forEach((key) => {
    const prevValue = prevRecord[key]
    const nextValue = nextRecord[key]

    try {
      if (JSON.stringify(prevValue) !== JSON.stringify(nextValue)) {
        changed.push(key)
      }
    } catch {
      if (prevValue !== nextValue) {
        changed.push(key)
      }
    }
  })

  return changed
}

const getSummaryMessage = (log: AuditLogEntry) => {
  const parsed = safeParse(log.newData)

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const record = parsed as Record<string, unknown>
    if (typeof record.message === 'string') {
      return record.message
    }
    if (typeof record.summary === 'string') {
      return record.summary
    }
  }

  return null
}

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))

const AuditLogSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, index) => (
      <Card key={index} className="border-dashed">
        <CardContent className="space-y-3 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
)

const AuditTrailTab = ({
  cycles,
  pagination,
  isLoadingCycles,
  cyclesError,
  onPageChange,
  onReloadCycles,
  selectedCycleId,
  onSelectCycle,
  cycleDetails,
  isLoadingDetails,
  detailsError,
  onRefreshCycle
}: AuditTrailTabProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  const auditLogs = useMemo(() => cycleDetails?.auditLogs ?? [], [cycleDetails])

  const uniqueActions = useMemo(() => {
    const actions = new Set<string>()
    auditLogs.forEach((log) => actions.add(log.action))
    return Array.from(actions).sort()
  }, [auditLogs])

  const actorCount = useMemo(() => {
    const actors = new Set<string>()
    auditLogs.forEach((log) => {
      const name = getActorName(log)
      if (name) {
        actors.add(name)
      }
    })
    return actors.size
  }, [auditLogs])

  const actionInsights = useMemo(() => {
    const counts = new Map<string, number>()
    auditLogs.forEach((log) => {
      counts.set(log.action, (counts.get(log.action) ?? 0) + 1)
    })

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
  }, [auditLogs])

  const filteredLogs = useMemo(() => {
    if (!auditLogs.length) {
      return []
    }

    const normalizedSearch = searchTerm.trim().toLowerCase()

    return auditLogs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const actorName = getActorName(log)?.toLowerCase() ?? ''
      const actionLabel = formatAction(log.action).toLowerCase()
      const newDataSearch = stringifyForSearch(log.newData)
      const previousDataSearch = stringifyForSearch(log.previousData)

      return (
        actorName.includes(normalizedSearch) ||
        actionLabel.includes(normalizedSearch) ||
        newDataSearch.includes(normalizedSearch) ||
        previousDataSearch.includes(normalizedSearch)
      )
    })
  }, [actionFilter, auditLogs, searchTerm])

  const latestEventAt = auditLogs[0]?.createdAt ?? null

  const handleToggleLog = (logId: string) => {
    setExpandedLogId((current) => (current === logId ? null : logId))
  }

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && pagination.page > 1) {
      onPageChange(pagination.page - 1)
    }

    if (direction === 'next' && pagination.page < pagination.totalPages) {
      onPageChange(pagination.page + 1)
    }
  }

  const disablePrev = isLoadingCycles || pagination.page <= 1
  const disableNext = isLoadingCycles || pagination.page >= pagination.totalPages

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Payroll audit trail
          </CardTitle>
          <CardDescription>
            Inspect every significant payroll change with actor context and before/after comparisons.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Payroll cycle</p>
                <Select
                  value={selectedCycleId ?? undefined}
                  onValueChange={(value) => onSelectCycle(value)}
                  disabled={isLoadingCycles || !cycles.length}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder={isLoadingCycles ? 'Loading cycles…' : 'Select a cycle'} />
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {formatCycleLabel(cycle)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReloadCycles()}
                  disabled={isLoadingCycles}
                  className="flex items-center gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reload cycles
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRefreshCycle()}
                  disabled={!selectedCycleId || isLoadingDetails}
                  className="flex items-center gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh audit
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
              <span>
                Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disablePrev}
                  onClick={() => handlePageChange('prev')}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disableNext}
                  onClick={() => handlePageChange('next')}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            Showing up to {pagination.limit} cycles per page. Use the selector to jump between monthly payroll runs.
          </div>
        </CardContent>
      </Card>

      {cyclesError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{cyclesError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Cycle insights
          </CardTitle>
          <CardDescription>
            Quick telemetry for the selected payroll cycle&apos;s audit history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDetails ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </div>
          ) : !selectedCycleId ? (
            <p className="text-sm text-muted-foreground">Select a payroll cycle to view its audit footprint.</p>
          ) : !auditLogs.length ? (
            <p className="text-sm text-muted-foreground">No audit activity has been captured for this payroll cycle yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase text-muted-foreground">Total events</p>
                <div className="mt-2 flex items-center gap-2 text-2xl font-semibold">
                  {auditLogs.length}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" /> Actors
                </p>
                <div className="mt-2 text-2xl font-semibold">{actorCount}</div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Last event
                </p>
                <div className="mt-2 text-sm font-medium">
                  {latestEventAt ? formatTimestamp(latestEventAt) : 'Not available'}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase text-muted-foreground">Top actions</p>
                <div className="mt-2 space-y-1 text-sm">
                  {actionInsights.length === 0 ? (
                    <span className="text-muted-foreground">No activity yet</span>
                  ) : (
                    actionInsights.map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between">
                        <span>{formatAction(action)}</span>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {count}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Search by actor, action, or payload content to pinpoint changes quickly.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Search</p>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Find by actor, action, or keyword"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Action</p>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {formatAction(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit events
          </CardTitle>
          <CardDescription>
            Detailed ledger of payroll cycle actions with before/after payloads.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {detailsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{detailsError}</AlertDescription>
            </Alert>
          )}

          {isLoadingDetails ? (
            <AuditLogSkeleton />
          ) : !selectedCycleId ? (
            <p className="text-sm text-muted-foreground">Select a cycle to review audit events.</p>
          ) : filteredLogs.length === 0 ? (
            <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No audit entries match your current filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id
                const actorName = getActorName(log)
                const changedFields = getChangedFields(log)
                const summaryMessage = getSummaryMessage(log)

                return (
                  <div key={log.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary">
                            {formatAction(log.action)}
                          </Badge>
                          {changedFields.length > 0 && (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">
                              {changedFields.length} field{changedFields.length > 1 ? 's' : ''} changed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {summaryMessage ?? formatAction(log.action)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(log.createdAt)}
                          {actorName ? ` • ${actorName}` : ''}
                        </p>
                        {changedFields.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Changed attributes: {changedFields.slice(0, 4).join(', ')}
                            {changedFields.length > 4 ? ` +${changedFields.length - 4} more` : ''}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLog(log.id)}
                        className="ml-auto flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {isExpanded ? 'Hide details' : 'View details'}
                      </Button>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Previous data</p>
                            <ScrollArea className="mt-2 max-h-60 rounded border bg-background">
                              <pre className="whitespace-pre-wrap p-3 text-xs leading-relaxed">
                                {prettyPrint(log.previousData)}
                              </pre>
                            </ScrollArea>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">New data</p>
                            <ScrollArea className="mt-2 max-h-60 rounded border bg-background">
                              <pre className="whitespace-pre-wrap p-3 text-xs leading-relaxed">
                                {prettyPrint(log.newData)}
                              </pre>
                            </ScrollArea>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AuditTrailTab
