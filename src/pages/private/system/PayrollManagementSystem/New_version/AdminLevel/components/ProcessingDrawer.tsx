import React from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { PayrollCycle, PayrollCycleDetails, PayrollSalaryStatistics } from '../../types/payroll'

type ProcessingRecord = PayrollCycleDetails['salaryRecords'][number]
type CalculationDetail = NonNullable<ProcessingRecord['calculationDetails']>[number]

type ProcessingDrawerProps = {
  open: boolean
  onClose: () => void
  selectedCycleLabel: string | null
  selectedCycleYear: number | null
  selectedCycle: PayrollCycle | null
  formatCurrency: (value: number) => string
  getStatusBadgeVariant: (status: string) => 'default' | 'destructive' | 'secondary' | 'outline' | 'success'
  employeeSearchTerm: string
  onEmployeeSearchTermChange: (value: string) => void
  filteredRecords: ProcessingRecord[]
  processingRecords: ProcessingRecord[]
  selectedRecord: ProcessingRecord | null
  onSelectRecord: (id: string | null) => void
  renderPaymentStatusBadge: (status?: string) => React.ReactNode
  formatPaymentStatus: (status?: string) => string
  isLoading: boolean
  error: string | null
  onRetry: () => void
  processingDetails: PayrollCycleDetails | null
  allowanceEntries: Array<{ key: string; amount: number }>
  deductionEntries: Array<{ key: string; amount: number }>
  calculationDetails: CalculationDetail[]
  attendanceSummary: ProcessingRecord['attendanceSummary']
  statistics: PayrollSalaryStatistics | null
  isStatisticsLoading: boolean
  statisticsError: string | null
  onReloadStatistics: () => void
  cycleSummary: { total: number; pending: number; approved: number; failed: number }
  onNavigateRecord: (direction: 'previous' | 'next') => void
  canNavigatePrev: boolean
  canNavigateNext: boolean
  onSubmitCycleForReview: () => void
  canSubmitCycleForReview: boolean
  isSubmittingForReview: boolean
  onOpenTemplateDialog: () => void
  onRecalculateSalary: () => void
  isRecalculatingSalary: boolean
}

const ProcessingDrawer: React.FC<ProcessingDrawerProps> = ({
  open,
  onClose,
  selectedCycleLabel,
  selectedCycleYear,
  selectedCycle,
  formatCurrency,
  getStatusBadgeVariant,
  employeeSearchTerm,
  onEmployeeSearchTermChange,
  filteredRecords,
  processingRecords,
  selectedRecord,
  onSelectRecord,
  renderPaymentStatusBadge,
  formatPaymentStatus,
  isLoading,
  error,
  onRetry,
  processingDetails,
  allowanceEntries,
  deductionEntries,
  calculationDetails,
  attendanceSummary,
  statistics,
  isStatisticsLoading,
  statisticsError,
  onReloadStatistics,
  cycleSummary,
  onNavigateRecord,
  canNavigatePrev,
  canNavigateNext,
  onSubmitCycleForReview,
  canSubmitCycleForReview,
  isSubmittingForReview,
  onOpenTemplateDialog,
  onRecalculateSalary,
  isRecalculatingSalary
}) => {
  const attendanceAnalysis = statistics?.attendanceAnalysis
  const attendanceDetails = statistics?.attendanceDetails
  const summaryByStatus = attendanceAnalysis?.summaryByStatus ?? attendanceDetails?.summaryByStatus ?? null
  const totals = attendanceAnalysis?.totals ?? attendanceDetails?.totals

  const workingDays = attendanceAnalysis?.workingDays ?? attendanceSummary?.workingDays ?? attendanceSummary?.totalDays ?? 0
  const totalDaysInMonth = attendanceAnalysis?.totalDaysInMonth ?? attendanceSummary?.totalDays ?? workingDays
  const presentDays = attendanceAnalysis?.presentDays ?? attendanceSummary?.presentDays ?? 0
  const absentDays = attendanceAnalysis?.absentDays ?? attendanceSummary?.absentDays ?? Math.max(0, workingDays - presentDays)
  const halfDays = attendanceAnalysis?.halfDays ?? attendanceSummary?.halfDays ?? 0
  const paidLeaveDays = attendanceAnalysis?.paidLeaveDays ?? attendanceSummary?.paidLeaveDays ?? 0
  const unpaidLeaveDays = attendanceAnalysis?.unpaidLeaveDays ?? attendanceSummary?.unpaidLeaveDays ?? 0
  const attendancePercentage = attendanceAnalysis?.attendancePercentage ?? null
  const overtimeHours = attendanceSummary?.overtimeHours ?? null
  const lateMarks = attendanceSummary?.lateMarks ?? null
  const hoursWorked = totals?.hoursWorked ?? null
  const breakMinutes = totals?.breakMinutes ?? null
  const attendanceEntriesCount = totals?.attendanceEntries ?? null
  const geofenceViolationCount = totals?.geofenceViolationCount ?? null
  const calendarEntries = attendanceDetails?.calendar ?? []

  const toTitleCase = (value: string) =>
    value
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

  const formatStatusMeta = (status?: string) => {
    const normalized = status?.toUpperCase() ?? 'NO_RECORD'
    switch (normalized) {
      case 'PRESENT':
        return { label: 'Present', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
      case 'ABSENT':
        return { label: 'Absent', className: 'bg-red-100 text-red-700 border-red-200' }
      case 'HALF_DAY':
        return { label: 'Half day', className: 'bg-amber-100 text-amber-700 border-amber-200' }
      case 'PAID_LEAVE':
        return { label: 'Paid leave', className: 'bg-sky-100 text-sky-700 border-sky-200' }
      case 'UNPAID_LEAVE':
        return { label: 'Unpaid leave', className: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' }
      case 'HOLIDAY':
        return { label: 'Holiday', className: 'bg-purple-100 text-purple-700 border-purple-200' }
      case 'WEEKEND':
        return { label: 'Weekend', className: 'bg-slate-100 text-slate-700 border-slate-300' }
      default:
        return {
          label: toTitleCase(normalized.replace(/_/g, ' ')),
          className: 'bg-slate-100 text-slate-700 border-slate-300'
        }
    }
  }

  const formatDateLabel = (iso: string) => {
    const parsed = new Date(iso)
    if (Number.isNaN(parsed.getTime())) {
      return '—'
    }
    return parsed.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short'
    })
  }

  const formatTimeLabel = (iso?: string | null) => {
    if (!iso) {
      return '—'
    }
    const parsed = new Date(iso)
    if (Number.isNaN(parsed.getTime())) {
      return '—'
    }
    return parsed.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatHoursLabel = (hoursValue?: number | null) => {
    if (hoursValue === null || hoursValue === undefined) {
      return '—'
    }
    if (hoursValue === 0) {
      return '0h'
    }
    return `${hoursValue.toFixed(2)}h`
  }

  const formatMinutesLabel = (minutesValue?: number | null) => {
    if (minutesValue === null || minutesValue === undefined) {
      return '—'
    }
    const rounded = Math.round(minutesValue)
    if (rounded <= 0) {
      return '0m'
    }
    const hours = Math.floor(rounded / 60)
    const minutes = rounded % 60
    if (hours && minutes) {
      return `${hours}h ${minutes}m`
    }
    if (hours) {
      return `${hours}h`
    }
    return `${minutes}m`
  }

  const buildDailyNote = (entry: (typeof calendarEntries)[number]) => {
    const notes: string[] = []
    if (entry.holiday) {
      const holidayName = (entry.holiday as { name?: unknown })?.name
      notes.push(
        `Holiday${typeof holidayName === 'string' && holidayName.trim() ? `: ${holidayName}` : ''}`
      )
    }

    if (Array.isArray(entry.leave) && entry.leave.length > 0) {
      notes.push('Leave recorded')
    }

    if (entry.isWeekend && (entry.attendanceStatus === 'NO_RECORD' || !entry.attendanceStatus)) {
      notes.push('Weekend')
    }

    const recordCount = Array.isArray(entry.records) ? entry.records.length : 0
    if (recordCount > 1) {
      notes.push(`${recordCount} punches`)
    }

    if (Array.isArray(entry.records)) {
      const notedRecord = entry.records.find(
        (record) => typeof record?.notes === 'string' && record.notes.trim().length > 0
      ) as { notes?: string } | undefined
      if (notedRecord?.notes) {
        notes.push(notedRecord.notes.trim())
      }
    }

    return notes.join(' • ')
  }
  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
    >
      <DrawerContent className="flex h-[90vh] max-h-[90vh] flex-col">
        <DrawerHeader className="gap-1">
          <DrawerTitle>
            {selectedCycleLabel && selectedCycleYear
              ? `Processing ${selectedCycleLabel} ${selectedCycleYear}`
              : 'Cycle processing workspace'}
          </DrawerTitle>
          <DrawerDescription>
            Navigate through each employee to validate salary breakdowns, attendance inputs, and template assignments before approval.
          </DrawerDescription>
          {selectedCycle && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Badge variant={getStatusBadgeVariant(selectedCycle.status)}>
                {selectedCycle.status.replace('_', ' ')}
              </Badge>
              <span>
                {selectedCycle.processedCount} / {selectedCycle.totalEmployees} processed
              </span>
              {typeof selectedCycle.totalAmount === 'number' && (
                <span>Total {formatCurrency(selectedCycle.totalAmount)}</span>
              )}
            </div>
          )}
        </DrawerHeader>

        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          <div className="border-b md:w-72 md:border-b-0 md:border-r">
            <div className="px-3 pb-2 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Employees
              </div>
              <Input
                value={employeeSearchTerm}
                onChange={(event) => onEmployeeSearchTermChange(event.target.value)}
                placeholder="Search by name or ID"
                className="h-8"
                aria-label="Search employees"
              />
            </div>
            <ScrollArea className="h-48 md:h-full">
              <div className="space-y-2 px-3 pb-6">
                {filteredRecords.length ? (
                  filteredRecords.map((record) => {
                    const fullName = [record.user?.firstName, record.user?.lastName]
                      .filter(Boolean)
                      .join(' ') || 'Employee'
                    const employeeId = record.user?.employeeId || 'ID unavailable'
                    const isActive = selectedRecord?.id === record.id

                    return (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() => onSelectRecord(record.id)}
                        className={cn(
                          'w-full rounded-md border p-3 text-left transition-colors',
                          isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/40 hover:bg-muted'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{fullName}</span>
                          <Badge variant={getStatusBadgeVariant(record.status)}>{record.status}</Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {employeeId} • Net {formatCurrency(record.netSalary)}
                        </p>
                        {record.paymentStatus && (
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Payment: {formatPaymentStatus(record.paymentStatus)}
                          </p>
                        )}
                      </button>
                    )
                  })
                ) : (
                  <div className="py-10 text-center text-xs text-muted-foreground">
                    {processingRecords.length
                      ? 'No employees match your search.'
                      : 'No salary records generated yet for this cycle.'}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-6">
            {isLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading cycle details…
              </div>
            ) : error ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTitle>Unable to load processing data</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div>
                  <Button size="sm" onClick={onRetry}>
                    Retry fetch
                  </Button>
                </div>
              </div>
            ) : selectedRecord ? (
              <div className="space-y-4">
                {isRecalculatingSalary && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertTitle>Recalculating salary…</AlertTitle>
                    <AlertDescription>
                      We’re regenerating this employee’s payroll data using the latest template and attendance inputs.
                    </AlertDescription>
                  </Alert>
                )}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {[selectedRecord.user?.firstName, selectedRecord.user?.lastName]
                            .filter(Boolean)
                            .join(' ') || 'Employee overview'}
                        </CardTitle>
                        <CardDescription>
                          {selectedRecord.user?.employeeId || 'Employee ID unavailable'} •{' '}
                          {(selectedRecord.user?.department?.name && selectedRecord.user.department.name) || 'Department N/A'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onNavigateRecord('previous')}
                          disabled={!canNavigatePrev}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onNavigateRecord('next')}
                          disabled={!canNavigateNext}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={getStatusBadgeVariant(selectedRecord.status)}>
                        {selectedRecord.status}
                      </Badge>
                      {selectedRecord.paymentStatus && renderPaymentStatusBadge(selectedRecord.paymentStatus)}
                      <span>
                        Net salary {formatCurrency(selectedRecord.netSalary)} • Basic {formatCurrency(selectedRecord.basicSalary)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">Template</p>
                        <p className="mt-1 font-semibold">
                          {selectedRecord.templateName || selectedRecord.templateId ||
                            processingDetails?.template?.name ||
                            'Template not assigned'}
                        </p>
                        {processingDetails?.template?.description && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {processingDetails.template.description}
                          </p>
                        )}
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">Processing timeline</p>
                        <p className="mt-1 text-sm">
                          Calculated on{' '}
                          {selectedRecord.processedAt
                            ? new Date(selectedRecord.processedAt).toLocaleString()
                            : 'Not processed yet'}
                        </p>
                        {selectedRecord.reviewedAt && (
                          <p className="text-xs text-muted-foreground">
                            Reviewed on {new Date(selectedRecord.reviewedAt).toLocaleString()}
                          </p>
                        )}
                        {selectedRecord.reviewComments && (
                          <p className="mt-1 text-xs italic text-muted-foreground">
                            “{selectedRecord.reviewComments}”
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Salary breakdown</CardTitle>
                    <CardDescription>
                      Detailed earnings and deductions for the selected employee in this cycle.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-semibold">Allowances</h4>
                        <Separator className="my-2" />
                        {allowanceEntries.length ? (
                          <div className="space-y-2">
                            {allowanceEntries.map((entry) => (
                              <div key={entry.key} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{entry.key}</span>
                                <span className="font-medium">{formatCurrency(entry.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No allowances applied.</p>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">Deductions</h4>
                        <Separator className="my-2" />
                        {deductionEntries.length ? (
                          <div className="space-y-2">
                            {deductionEntries.map((entry) => (
                              <div key={entry.key} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{entry.key}</span>
                                <span className="font-medium">{formatCurrency(entry.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No deductions recorded.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold">Calculation details</h4>
                      <Separator className="my-2" />
                      {calculationDetails.length ? (
                        <div className="space-y-3 text-sm">
                          {calculationDetails.map((item, index) => (
                            <div key={`${item.label}-${index}`} className="rounded-md border p-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{item.label}</span>
                                <span className={cn('font-semibold', item.amount < 0 && 'text-destructive')}>
                                  {formatCurrency(item.amount)}
                                </span>
                              </div>
                              {item.description && (
                                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                              )}
                              {item.formula && (
                                <p className="mt-1 text-[10px] font-mono text-muted-foreground">{item.formula}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Detailed calculation traces will appear here once available from the engine.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Attendance review</CardTitle>
                    <CardDescription>
                      Verify check-in/out data and leave contributions impacting this salary.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isStatisticsLoading && !statistics ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading attendance metrics…
                      </div>
                    ) : statisticsError && !statistics ? (
                      <div className="space-y-3">
                        <Alert variant="destructive">
                          <AlertTitle>Unable to load attendance details</AlertTitle>
                          <AlertDescription>{statisticsError}</AlertDescription>
                        </Alert>
                        <Button size="sm" onClick={onReloadStatistics}>
                          Retry fetch
                        </Button>
                      </div>
                    ) : statistics || attendanceSummary ? (
                      <>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Working days</p>
                            <p className="text-lg font-semibold">{workingDays}</p>
                            <p className="text-xs text-muted-foreground">
                              Total days {totalDaysInMonth}
                            </p>
                            {attendancePercentage !== null && (
                              <p className="text-xs text-emerald-700">{attendancePercentage.toFixed(1)}% attendance</p>
                            )}
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Presence mix</p>
                            <p className="text-sm font-medium">
                              Present {presentDays} • Absent {absentDays} • Half {halfDays}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Paid leave {paidLeaveDays} • Unpaid leave {unpaidLeaveDays}
                            </p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Exceptions</p>
                            <p className="text-sm font-medium">
                              Overtime {formatHoursLabel(overtimeHours ?? 0)} • Late marks {lateMarks ?? 0}
                            </p>
                            {attendanceEntriesCount !== null && (
                              <p className="text-xs text-muted-foreground">{attendanceEntriesCount} attendance entries</p>
                            )}
                          </div>
                        </div>

                        {summaryByStatus && Object.keys(summaryByStatus).length > 0 && (
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {Object.entries(summaryByStatus).map(([status, count]) => {
                              const meta = formatStatusMeta(status)
                              return (
                                <span
                                  key={status}
                                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]"
                                >
                                  <span className="font-medium text-foreground">{meta.label}</span>
                                  <span>({count})</span>
                                </span>
                              )
                            })}
                          </div>
                        )}

                        {(hoursWorked !== null || breakMinutes !== null || geofenceViolationCount !== null) && (
                          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                            {hoursWorked !== null && (
                              <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Hours logged</p>
                                <p className="text-sm font-semibold">{formatHoursLabel(hoursWorked)}</p>
                              </div>
                            )}
                            {breakMinutes !== null && (
                              <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Break duration</p>
                                <p className="text-sm font-semibold">{formatMinutesLabel(breakMinutes)}</p>
                              </div>
                            )}
                            {attendanceEntriesCount !== null && (
                              <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Attendance entries</p>
                                <p className="text-sm font-semibold">{attendanceEntriesCount}</p>
                              </div>
                            )}
                            {geofenceViolationCount !== null && (
                              <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Geofence violations</p>
                                <p className="text-sm font-semibold">{geofenceViolationCount}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="rounded-lg border">
                          <div className="flex flex-col gap-2 border-b px-3 py-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-semibold">Daily breakdown</p>
                              {statistics ? (
                                <p className="text-xs text-muted-foreground">
                                  {calendarEntries.length} of {totalDaysInMonth} days captured
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Attendance breakdown loads automatically once synced.
                                </p>
                              )}
                            </div>
                            {statistics && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={onReloadStatistics}
                                disabled={isStatisticsLoading}
                              >
                                {isStatisticsLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                Refresh
                              </Button>
                            )}
                          </div>
                          {calendarEntries.length ? (
                            <ScrollArea className="max-h-64">
                              <table className="w-full min-w-[540px] text-sm">
                                <thead className="bg-muted/50">
                                  <tr className="text-left text-xs text-muted-foreground">
                                    <th className="px-3 py-2 font-medium">Date</th>
                                    <th className="px-3 py-2 font-medium">Status</th>
                                    <th className="px-3 py-2 font-medium">Check-in • out</th>
                                    <th className="px-3 py-2 font-medium">Hours</th>
                                    <th className="px-3 py-2 font-medium">Notes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {calendarEntries.map((entry) => {
                                    const records = Array.isArray(entry.records) ? entry.records : []
                                    const totalDuration = records.reduce((sum, record) => sum + (record?.durationHours ?? 0), 0)
                                    const primaryRecord = records[0]
                                    const statusMeta = formatStatusMeta(entry.attendanceStatus)
                                    const note = buildDailyNote(entry)

                                    return (
                                      <tr
                                        key={entry.date ?? entry.day}
                                        className={cn(
                                          'border-b last:border-b-0 text-xs',
                                          entry.isWeekend && 'bg-muted/30'
                                        )}
                                      >
                                        <td className="px-3 py-2 font-medium text-foreground">
                                          <div className="flex flex-col">
                                            <span>{entry.date ? formatDateLabel(entry.date) : `Day ${entry.day}`}</span>
                                            <span className="text-[10px] text-muted-foreground">Day {entry.day}</span>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2">
                                          <Badge variant="outline" className={cn('text-xs font-medium', statusMeta.className)}>
                                            {statusMeta.label}
                                          </Badge>
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground">
                                          {`${formatTimeLabel((primaryRecord as { checkInTime?: string | null })?.checkInTime)} • ${formatTimeLabel((primaryRecord as { checkOutTime?: string | null })?.checkOutTime)}`}
                                        </td>
                                        <td className="px-3 py-2 font-medium text-foreground">
                                          {formatHoursLabel(totalDuration)}
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground">
                                          {note || '—'}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </ScrollArea>
                          ) : (
                            <div className="px-3 py-6 text-sm text-muted-foreground">
                              Attendance records for this period have not been synchronised yet.
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <Alert>
                        <AlertTitle>Attendance integration coming soon</AlertTitle>
                        <AlertDescription>
                          Raw attendance records are not yet linked. This section will surface check-ins, leaves, and manual adjustments once the integration lands.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Next actions</CardTitle>
                    <CardDescription>
                      Use these quick actions to finalise salaries before sending the cycle for review. Additional adjustment tooling is on the way.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      • Use <span className="font-medium">Change template</span> to reassign the employee to a different salary structure instantly.
                    </p>
                    <p>
                      • Kick off a clean recalculation with <span className="font-medium">Recalculate salary</span> to pull in the latest template and attendance data.
                    </p>
                    <p>
                      • Manual attendance corrections will arrive soon and auto-trigger regeneration with full audit logging.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select a salary record from the list to view its breakdown.
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="flex flex-col gap-2 border-t py-3 md:flex-row md:items-center md:justify-between">
          <p
            className={cn(
              'text-xs text-muted-foreground',
              (cycleSummary.pending > 0 || cycleSummary.failed > 0) && 'text-destructive'
            )}
          >
            {cycleSummary.total
              ? `${cycleSummary.pending} pending • ${cycleSummary.approved} ready • ${cycleSummary.failed} require attention`
              : 'No salary records generated yet for this cycle.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <DrawerClose asChild>
              <Button variant="outline" size="sm">
                Close
              </Button>
            </DrawerClose>
            <Button
              size="sm"
              onClick={onSubmitCycleForReview}
              disabled={!canSubmitCycleForReview || isLoading || isRecalculatingSalary || isSubmittingForReview}
            >
              {isSubmittingForReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for review
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenTemplateDialog}
              disabled={!selectedRecord || isLoading || isRecalculatingSalary || isSubmittingForReview}
            >
              Change template
            </Button>
            <Button
              size="sm"
              onClick={onRecalculateSalary}
              disabled={!selectedRecord || isLoading || isRecalculatingSalary || isSubmittingForReview}
            >
              {isRecalculatingSalary && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Recalculate salary
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default ProcessingDrawer
