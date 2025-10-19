import React, { useEffect, useMemo, useRef, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Loader2, ThumbsUp, ThumbsDown, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import type { PayrollCycleDetails, PayrollSalaryStatistics } from '../../../types/payroll'
import * as pipelineApi from '../../services/pipelineApi'

// Use SalaryRecord type from PayrollCycleDetails
type SalaryRecord = PayrollCycleDetails['salaryRecords'][number]

type ReviewDrawerProps = {
  open: boolean
  onClose: () => void
  cycleLabel: string
  cycleYear: number
  records: SalaryRecord[]
  formatCurrency: (value: number) => string
  onApproveRecord: (recordId: string, comments?: string) => Promise<void>
  onRejectRecord: (recordId: string, comments: string) => Promise<void>
  isLoading?: boolean
  onApproveAllPending: () => Promise<void>
  isBulkApproving?: boolean
}

const ReviewDrawer: React.FC<ReviewDrawerProps> = ({
  open,
  onClose,
  cycleLabel,
  cycleYear,
  records,
  formatCurrency,
  onApproveRecord,
  onRejectRecord,
  isLoading = false,
  onApproveAllPending,
  isBulkApproving = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [reviewComments, setReviewComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const statisticsCacheRef = useRef<Record<string, PayrollSalaryStatistics>>({})
  const [selectedStatistics, setSelectedStatistics] = useState<PayrollSalaryStatistics | null>(null)
  const [statisticsError, setStatisticsError] = useState<string | null>(null)
  const [isStatisticsLoading, setIsStatisticsLoading] = useState(false)

  const selectedRecord = records.find(r => r.id === selectedRecordId) || null

  const filteredRecords = records.filter(record => {
    if (!searchTerm) return true
    const fullName = [record.user?.firstName, record.user?.lastName].filter(Boolean).join(' ').toLowerCase()
    const employeeId = record.user?.employeeId?.toLowerCase() || ''
    return fullName.includes(searchTerm.toLowerCase()) || employeeId.includes(searchTerm.toLowerCase())
  })

  useEffect(() => {
    if (!open) {
      return
    }

    if (!filteredRecords.length) {
      return
    }

    if (!selectedRecordId || !filteredRecords.some(record => record.id === selectedRecordId)) {
      const firstRecord = filteredRecords[0]
      setSelectedRecordId(firstRecord.id)
      setReviewComments(firstRecord.reviewComments || '')
    }
  }, [open, filteredRecords, selectedRecordId])

  useEffect(() => {
    if (open) {
      return
    }

    setSelectedRecordId(null)
    setSelectedStatistics(null)
    setStatisticsError(null)
    setIsStatisticsLoading(false)
    setReviewComments('')
  }, [open])

  useEffect(() => {
    if (!selectedRecordId) {
      setSelectedStatistics(null)
      setStatisticsError(null)
      setIsStatisticsLoading(false)
      return
    }

    const cached = statisticsCacheRef.current[selectedRecordId]
    if (cached) {
      setSelectedStatistics(cached)
      setStatisticsError(null)
      setIsStatisticsLoading(false)
      return
    }

    let isCancelled = false
    setIsStatisticsLoading(true)
    setStatisticsError(null)
    setSelectedStatistics(null)

    const loadStatistics = async () => {
      try {
        const response = await pipelineApi.fetchSalaryStatistics(selectedRecordId)
        if (isCancelled) {
          return
        }

        if (response?.success && response.data) {
          statisticsCacheRef.current = {
            ...statisticsCacheRef.current,
            [selectedRecordId]: response.data
          }
          setSelectedStatistics(response.data)
          setStatisticsError(null)
        } else {
          setStatisticsError(response?.message || 'Failed to load attendance details')
        }
      } catch (error) {
        if (!isCancelled) {
          setStatisticsError(error instanceof Error ? error.message : 'Failed to load attendance details')
        }
      } finally {
        if (!isCancelled) {
          setIsStatisticsLoading(false)
        }
      }
    }

    loadStatistics()

    return () => {
      isCancelled = true
    }
  }, [selectedRecordId])

  const currentIndex = selectedRecord ? filteredRecords.findIndex(r => r.id === selectedRecord.id) : -1
  const canNavigatePrev = currentIndex > 0
  const canNavigateNext = currentIndex < filteredRecords.length - 1

  const handleNavigate = (direction: 'previous' | 'next') => {
    if (direction === 'previous' && canNavigatePrev) {
      setSelectedRecordId(filteredRecords[currentIndex - 1].id)
      setReviewComments('')
    } else if (direction === 'next' && canNavigateNext) {
      setSelectedRecordId(filteredRecords[currentIndex + 1].id)
      setReviewComments('')
    }
  }

  const handleApprove = async () => {
    if (!selectedRecord) return
    setIsSubmitting(true)
    try {
      await onApproveRecord(selectedRecord.id, reviewComments)
      setReviewComments('')
      // Auto-navigate to next record
      if (canNavigateNext) {
        handleNavigate('next')
      }
    } catch (error) {
      console.error('Failed to approve:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRecord || !reviewComments.trim()) {
      return
    }
    setIsSubmitting(true)
    try {
      await onRejectRecord(selectedRecord.id, reviewComments)
      setReviewComments('')
      // Auto-navigate to next record
      if (canNavigateNext) {
        handleNavigate('next')
      }
    } catch (error) {
      console.error('Failed to reject:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRefreshStatistics = async () => {
    if (!selectedRecordId) {
      return
    }

    setIsStatisticsLoading(true)
    setStatisticsError(null)

    try {
      const response = await pipelineApi.fetchSalaryStatistics(selectedRecordId)

      if (response?.success && response.data) {
        statisticsCacheRef.current = {
          ...statisticsCacheRef.current,
          [selectedRecordId]: response.data
        }
        setSelectedStatistics(response.data)
        setStatisticsError(null)
      } else {
        setStatisticsError(response?.message || 'Failed to refresh attendance details')
      }
    } catch (error) {
      setStatisticsError(error instanceof Error ? error.message : 'Failed to refresh attendance details')
    } finally {
      setIsStatisticsLoading(false)
    }
  }

  // Helper functions to calculate totals
  const calculateTotalAllowances = (record: SalaryRecord) => {
    if (!record.allowances) return 0
    return Object.values(record.allowances).reduce((sum, amount) => sum + amount, 0)
  }

  const calculateTotalDeductions = (record: SalaryRecord) => {
    if (!record.deductions) return 0
    return Object.values(record.deductions).reduce((sum, amount) => sum + amount, 0)
  }

  const calculateGrossSalary = (record: SalaryRecord) => {
    return record.basicSalary + calculateTotalAllowances(record)
  }

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

  const formatDateTime = (iso?: string | null) => {
    if (!iso) {
      return '—'
    }
    const parsed = new Date(iso)
    if (Number.isNaN(parsed.getTime())) {
      return '—'
    }
    return parsed.toLocaleString()
  }

  const buildDailyNote = (entry: NonNullable<NonNullable<PayrollSalaryStatistics['attendanceDetails']>['calendar']>[number]) => {
    const notes: string[] = []

    if (entry.holiday) {
      const holidayName = (entry.holiday as { name?: unknown })?.name
      notes.push(
        `Holiday${typeof holidayName === 'string' && holidayName.trim().length ? `: ${holidayName}` : ''}`
      )
    }

    if (Array.isArray(entry.leave) && entry.leave.length > 0) {
      const leaveLabel = entry.leave
        .map((leaveItem) => {
          const typed = leaveItem as { leaveType?: string | null }
          return typed.leaveType || 'Leave'
        })
        .filter((label) => typeof label === 'string')
        .join(', ')
      notes.push(`Leave${leaveLabel ? `: ${leaveLabel}` : ''}`)
    }

    if (entry.isWeekend && (!entry.attendanceStatus || entry.attendanceStatus === 'NO_RECORD')) {
      notes.push('Weekend')
    }

    const records = Array.isArray(entry.records) ? entry.records : []
    if (records.length > 1) {
      notes.push(`${records.length} punches`)
    }

    const notedRecord = records.find((record) => {
      const notesValue = (record as { notes?: string | null })?.notes
      return typeof notesValue === 'string' && notesValue.trim().length > 0
    }) as { notes?: string | null } | undefined

    if (notedRecord?.notes && notedRecord.notes.trim().length > 0) {
      notes.push(notedRecord.notes.trim())
    }

    return notes.join(' • ')
  }

  const formatDateRange = (start?: string | null, end?: string | null) => {
    if (!start && !end) {
      return '—'
    }

    const format = (value: string | null | undefined) => {
      if (!value) {
        return null
      }
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) {
        return null
      }
      return parsed.toLocaleDateString()
    }

    const formattedStart = format(start)
    const formattedEnd = format(end)

    if (formattedStart && formattedEnd && formattedStart !== formattedEnd) {
      return `${formattedStart} → ${formattedEnd}`
    }

    return formattedStart || formattedEnd || '—'
  }

  const getReviewStatusBadge = (status?: string) => {
    if (!status || status === 'PENDING' || status === 'PROCESSED' || status === 'PROCESSING') {
      return <Badge variant="secondary">Pending Review</Badge>
    }
    if (status === 'APPROVED') {
      return <Badge variant="success" className="bg-green-100 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    }
    if (status === 'REJECTED') {
      return <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Rejected
      </Badge>
    }
    return null
  }

  const allowanceEntries = selectedRecord?.allowances 
    ? Object.entries(selectedRecord.allowances).map(([key, amount]) => ({ key, amount }))
    : []
  
  const deductionEntries = selectedRecord?.deductions
    ? Object.entries(selectedRecord.deductions).map(([key, amount]) => ({ key, amount }))
    : []

  const fallbackAttendanceSummary = selectedRecord?.attendanceSummary
  const attendanceAnalysis = selectedStatistics?.attendanceAnalysis
  const attendanceDetails = selectedStatistics?.attendanceDetails
  const workingDays = attendanceAnalysis?.workingDays ?? fallbackAttendanceSummary?.workingDays ?? fallbackAttendanceSummary?.totalDays ?? 0
  const totalDaysInMonth = attendanceAnalysis?.totalDaysInMonth ?? attendanceDetails?.metadata?.daysInMonth ?? fallbackAttendanceSummary?.totalDays ?? workingDays
  const presentDays = attendanceAnalysis?.presentDays ?? fallbackAttendanceSummary?.presentDays ?? 0
  const absentDays = attendanceAnalysis?.absentDays ?? fallbackAttendanceSummary?.absentDays ?? Math.max(0, workingDays - presentDays)
  const halfDays = attendanceAnalysis?.halfDays ?? fallbackAttendanceSummary?.halfDays ?? 0
  const paidLeaveDays = attendanceAnalysis?.paidLeaveDays ?? fallbackAttendanceSummary?.paidLeaveDays ?? 0
  const unpaidLeaveDays = attendanceAnalysis?.unpaidLeaveDays ?? fallbackAttendanceSummary?.unpaidLeaveDays ?? 0
  const fallbackAttendancePercentage =
    typeof fallbackAttendanceSummary?.presentDays === 'number' &&
    typeof fallbackAttendanceSummary?.workingDays === 'number' &&
    fallbackAttendanceSummary.workingDays > 0
      ? (fallbackAttendanceSummary.presentDays / fallbackAttendanceSummary.workingDays) * 100
      : null
  const attendancePercentage = attendanceAnalysis?.attendancePercentage ?? fallbackAttendancePercentage ?? null
  const attendanceTotals = attendanceAnalysis?.totals ?? attendanceDetails?.totals ?? {}
  const calendarEntries = attendanceDetails?.calendar ?? []
  const summaryByStatus = attendanceAnalysis?.summaryByStatus ?? attendanceDetails?.summaryByStatus ?? {}
  const breakHistory = attendanceDetails?.breakHistory ?? []
  const geofenceHistory = attendanceDetails?.geofenceHistory ?? []
  const hoursWorked = attendanceTotals?.hoursWorked ?? null
  const breakMinutes = attendanceTotals?.breakMinutes ?? null
  const attendanceEntriesCount = attendanceTotals?.attendanceEntries ??
    (Array.isArray(calendarEntries)
      ? calendarEntries.reduce((sum, entry) => sum + (Array.isArray(entry.records) ? entry.records.length : 0), 0)
      : null)
  const geofenceViolationCount = attendanceTotals?.geofenceViolationCount ?? (Array.isArray(geofenceHistory) ? geofenceHistory.length : null)
  const formattedAttendancePercentage = typeof attendancePercentage === 'number' ? `${attendancePercentage.toFixed(1)}%` : '—'
  const hasStatisticsData = Boolean(
    attendanceAnalysis ||
    fallbackAttendanceSummary ||
    (Array.isArray(calendarEntries) && calendarEntries.length > 0) ||
    breakHistory.length ||
    geofenceHistory.length
  )

  const derivedAttendanceRecords = useMemo(() => {
    if (!Array.isArray(calendarEntries)) {
      return []
    }

    return calendarEntries.flatMap((entry) => {
      const records = Array.isArray(entry.records) ? entry.records : []
      if (!records.length) {
        return []
      }

      return records.map((record) => ({
        date: entry.date,
        day: entry.day,
        attendanceStatus: entry.attendanceStatus,
        isWeekend: entry.isWeekend,
        ...record
      }))
    })
  }, [calendarEntries])

  const derivedLeaveEntries = useMemo(() => {
    if (!Array.isArray(calendarEntries)) {
      return []
    }

    return calendarEntries.flatMap((entry) => {
      if (!Array.isArray(entry.leave) || !entry.leave.length) {
        return []
      }

      return entry.leave.map((leaveItem) => {
        const typed = leaveItem as {
          leaveType?: string | null
          status?: string | null
          startDate?: string | null
          endDate?: string | null
          duration?: number | null
          durationDays?: number | null
        }

        return {
          date: entry.date,
          leaveType: typed.leaveType ?? 'Leave',
          status: typed.status ?? null,
          startDate: typed.startDate ?? null,
          endDate: typed.endDate ?? null,
          durationDays: typed.durationDays ?? typed.duration ?? null
        }
      })
    })
  }, [calendarEntries])

  const pendingCount = records.filter(r => !r.status || r.status === 'PENDING' || r.status === 'PROCESSED').length
  const approvedCount = records.filter(r => r.status === 'APPROVED').length
  const rejectedCount = records.filter(r => r.status === 'REJECTED').length

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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <DrawerTitle>
                Review Salary Records - {cycleLabel} {cycleYear}
              </DrawerTitle>
              <DrawerDescription>
                Review each employee's salary calculation, approve or reject with comments. Navigate through employees one by one.
              </DrawerDescription>
            </div>
            {pendingCount > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (!isBulkApproving) {
                    onApproveAllPending()
                  }
                }}
                className="bg-green-600 text-white hover:bg-green-700"
                disabled={isBulkApproving}
              >
                {isBulkApproving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Approve All Pending ({pendingCount})
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="secondary">{pendingCount} Pending</Badge>
            <Badge variant="success" className="bg-green-100 text-green-700">{approvedCount} Approved</Badge>
            <Badge variant="destructive">{rejectedCount} Rejected</Badge>
            <span>{records.length} Total Records</span>
          </div>
        </DrawerHeader>

        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          {/* Employee List Sidebar */}
          <div className="border-b md:w-72 md:border-b-0 md:border-r">
            <div className="px-3 pb-2 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Employees ({filteredRecords.length})
              </div>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                        onClick={() => {
                          setSelectedRecordId(record.id)
                          setReviewComments(record.reviewComments || '')
                        }}
                        className={cn(
                          'w-full rounded-md border p-3 text-left transition-colors',
                          isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/40 hover:bg-muted'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{fullName}</span>
                          {getReviewStatusBadge(record.status)}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {employeeId} • Net {formatCurrency(record.netSalary)}
                        </p>
                      </button>
                    )
                  })
                ) : (
                  <div className="py-10 text-center text-xs text-muted-foreground">
                    {records.length ? 'No employees match your search.' : 'No salary records found.'}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Employee Details */}
          <div className="flex-1 overflow-y-auto px-3 pb-6">
            {isLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading salary records…
              </div>
            ) : selectedRecord ? (
              <div className="space-y-4">
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
                          {selectedRecord.user?.department?.name || 'Department N/A'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleNavigate('previous')}
                          disabled={!canNavigatePrev || isSubmitting}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {currentIndex + 1} / {filteredRecords.length}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleNavigate('next')}
                          disabled={!canNavigateNext || isSubmitting}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {getReviewStatusBadge(selectedRecord.status)}
                      <span>
                        Net {formatCurrency(selectedRecord.netSalary)} • Basic {formatCurrency(selectedRecord.basicSalary)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">Template</p>
                        <p className="mt-1 font-semibold">
                          {selectedRecord.templateName || selectedRecord.templateId || 'Template not assigned'}
                        </p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">Processed</p>
                        <p className="mt-1 text-sm">
                          {selectedRecord.processedAt
                            ? new Date(selectedRecord.processedAt).toLocaleString()
                            : 'Not processed yet'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Salary Breakdown */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Salary Breakdown</CardTitle>
                    <CardDescription>Review the detailed salary calculation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">Gross Salary</p>
                        <p className="text-xl font-bold">{formatCurrency(calculateGrossSalary(selectedRecord))}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">Total Deductions</p>
                        <p className="text-xl font-bold text-red-600">
                          - {formatCurrency(calculateTotalDeductions(selectedRecord))}
                        </p>
                      </div>
                      <div className="rounded-lg border p-4 bg-green-50">
                        <p className="text-xs text-green-700">Net Salary</p>
                        <p className="text-xl font-bold text-green-900">{formatCurrency(selectedRecord.netSalary)}</p>
                      </div>
                    </div>

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
                            <Separator className="my-2" />
                            <div className="flex items-center justify-between text-sm font-semibold">
                              <span>Total Allowances</span>
                              <span>{formatCurrency(calculateTotalAllowances(selectedRecord))}</span>
                            </div>
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
                            <Separator className="my-2" />
                            <div className="flex items-center justify-between text-sm font-semibold">
                              <span>Total Deductions</span>
                              <span>{formatCurrency(calculateTotalDeductions(selectedRecord))}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No deductions recorded.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle>Monthly Attendance Overview</CardTitle>
                        <CardDescription>
                          Attendance, leaves, breaks, and location history considered for this salary record
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshStatistics}
                        disabled={isStatisticsLoading || !selectedRecordId}
                      >
                        {isStatisticsLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Refresh
                      </Button>
                    </div>
                    {selectedStatistics?.basicInfo && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Reporting for {selectedStatistics.basicInfo.monthName} {selectedStatistics.basicInfo.year}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {statisticsError && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Unable to load detailed attendance</AlertTitle>
                        <AlertDescription>{statisticsError}</AlertDescription>
                      </Alert>
                    )}

                    {isStatisticsLoading && !selectedStatistics && !statisticsError && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading attendance statistics…
                      </div>
                    )}

                    {hasStatisticsData ? (
                      <div className="space-y-6">
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Total Days</p>
                            <p className="text-lg font-semibold">{totalDaysInMonth}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Working Days</p>
                            <p className="text-lg font-semibold">{workingDays}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Present Days</p>
                            <p className="text-lg font-semibold text-green-600">{presentDays}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Absences</p>
                            <p className="text-lg font-semibold text-red-600">{absentDays}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Half Days</p>
                            <p className="text-lg font-semibold">{halfDays}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Paid Leave</p>
                            <p className="text-lg font-semibold text-blue-600">{paidLeaveDays}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Unpaid Leave</p>
                            <p className="text-lg font-semibold text-orange-600">{unpaidLeaveDays}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Attendance Rate</p>
                            <p className="text-lg font-semibold">{formattedAttendancePercentage}</p>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Hours Worked</p>
                            <p className="text-lg font-semibold">{formatHoursLabel(hoursWorked)}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Break Time</p>
                            <p className="text-lg font-semibold">{formatMinutesLabel(breakMinutes)}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Attendance Entries</p>
                            <p className="text-lg font-semibold">{attendanceEntriesCount ?? '—'}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Geofence Alerts</p>
                            <p className="text-lg font-semibold">{geofenceViolationCount ?? '—'}</p>
                          </div>
                        </div>

                        {Object.keys(summaryByStatus).length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold">Status Breakdown</h4>
                            <Separator className="my-2" />
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(summaryByStatus).map(([status, count]) => {
                                const meta = formatStatusMeta(status)
                                return (
                                  <Badge key={status} className={cn('border', meta.className)}>
                                    {meta.label}: {count}
                                  </Badge>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-semibold">Daily Attendance</h4>
                          <Separator className="my-2" />
                          {calendarEntries.length ? (
                            <ScrollArea className="max-h-64">
                              <div className="min-w-full divide-y text-sm">
                                {calendarEntries.map((entry) => {
                                  const meta = formatStatusMeta(entry.attendanceStatus)
                                  const firstRecord = Array.isArray(entry.records) && entry.records.length ? entry.records[0] : null
                                  const note = buildDailyNote(entry)
                                  return (
                                    <div key={`${entry.date}-summary`} className="grid grid-cols-1 gap-2 border-b border-dashed border-border p-3 sm:grid-cols-[120px_160px_160px_1fr]">
                                      <div>
                                        <div className="font-medium">{formatDateLabel(entry.date)}</div>
                                        <div className="text-xs text-muted-foreground">Day {entry.day}</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge className={cn('border px-2 py-1 text-xs', meta.className)}>{meta.label}</Badge>
                                        {entry.isWeekend && (
                                          <Badge variant="outline" className="text-xs">
                                            Weekend
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="grid gap-1 text-xs">
                                        <div>Check-in: {formatTimeLabel(firstRecord?.checkInTime)}</div>
                                        <div>Check-out: {formatTimeLabel(firstRecord?.checkOutTime)}</div>
                                        <div>Duration: {formatHoursLabel(firstRecord?.durationHours)}</div>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {note || 'No notes recorded.'}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </ScrollArea>
                          ) : (
                            <p className="text-sm text-muted-foreground">No daily attendance records were captured.</p>
                          )}
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                          <div>
                            <h4 className="text-sm font-semibold">Punch History</h4>
                            <Separator className="my-2" />
                            {derivedAttendanceRecords.length ? (
                              <ScrollArea className="max-h-56">
                                <div className="space-y-3 text-sm">
                                  {derivedAttendanceRecords.map((record, index) => {
                                    const statusMeta = formatStatusMeta(record.status ?? record.attendanceStatus)
                                    return (
                                      <div key={record.id ?? `${record.date}-${index}`} className="rounded-lg border p-3">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                          <span>{formatDateLabel(record.date)} • Day {record.day}</span>
                                          <Badge className={cn('border px-2 py-0 text-xs', statusMeta.className)}>{statusMeta.label}</Badge>
                                        </div>
                                        <div className="mt-2 grid gap-1 text-xs">
                                          <div>Check-in: {formatTimeLabel(record.checkInTime)}</div>
                                          <div>Check-out: {formatTimeLabel(record.checkOutTime)}</div>
                                          <div>Duration: {formatHoursLabel(record.durationHours)}</div>
                                          {record.notes && <div className="italic text-muted-foreground">{record.notes}</div>}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </ScrollArea>
                            ) : (
                              <p className="text-sm text-muted-foreground">No individual punch activity recorded.</p>
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold">Leave History</h4>
                            <Separator className="my-2" />
                            {derivedLeaveEntries.length ? (
                              <div className="space-y-3 text-sm">
                                {derivedLeaveEntries.map((leave, index) => (
                                  <div key={`${leave.date}-${index}`} className="rounded-lg border p-3">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span>{formatDateLabel(leave.date)}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {leave.leaveType}
                                      </Badge>
                                    </div>
                                    <div className="mt-2 text-xs">
                                      <div>Duration: {leave.durationDays ? `${leave.durationDays} day(s)` : '—'}</div>
                                      <div>Status: {leave.status ?? '—'}</div>
                                      <div>Range: {formatDateRange(leave.startDate, leave.endDate)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No leave applications detected for this period.</p>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                          <div>
                            <h4 className="text-sm font-semibold">Break History</h4>
                            <Separator className="my-2" />
                            {breakHistory.length ? (
                              <ScrollArea className="max-h-56">
                                <div className="space-y-3 text-sm">
                                  {breakHistory.map((breakEntry, index) => (
                                    <div key={breakEntry.id ?? `break-${index}`} className="rounded-lg border p-3">
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{breakEntry.breakType ?? 'Break'}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {breakEntry.status ?? 'Logged'}
                                        </Badge>
                                      </div>
                                      <div className="mt-2 text-xs">
                                        <div>Start: {formatDateTime(breakEntry.startTime)}</div>
                                        <div>End: {formatDateTime(breakEntry.endTime)}</div>
                                        <div>Duration: {formatMinutesLabel(breakEntry.durationMinutes)}</div>
                                        {breakEntry.note && <div className="italic text-muted-foreground">{breakEntry.note}</div>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            ) : (
                              <p className="text-sm text-muted-foreground">No break history captured for this employee.</p>
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold">Geofence &amp; Location History</h4>
                            <Separator className="my-2" />
                            {geofenceHistory.length ? (
                              <ScrollArea className="max-h-56">
                                <div className="space-y-3 text-sm">
                                  {geofenceHistory.map((event, index) => (
                                    <div key={event.id ?? `geo-${index}`} className="rounded-lg border p-3">
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{event.geofenceName ?? 'Geofence Event'}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {event.severity ?? 'Info'}
                                        </Badge>
                                      </div>
                                      <div className="mt-2 text-xs">
                                        <div>Type: {event.violationType ?? '—'}</div>
                                        <div>Reported: {formatDateTime(event.startTime)}</div>
                                        <div>Resolved: {formatDateTime(event.resolvedAt)}</div>
                                        {typeof event.distance === 'number' && <div>Distance: {event.distance.toFixed(1)} m</div>}
                                        {event.action && <div className="italic text-muted-foreground">Action: {event.action}</div>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            ) : (
                              <p className="text-sm text-muted-foreground">No geofence activity logged for this cycle.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      !statisticsError && !isStatisticsLoading && (
                        <p className="text-sm text-muted-foreground">No attendance data available for this salary record.</p>
                      )
                    )}
                  </CardContent>
                </Card>

                {/* Review Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Review Decision</CardTitle>
                    <CardDescription>
                      Approve this salary record or reject it with comments for corrections
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedRecord.status === 'APPROVED' && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-900">Already Approved</AlertTitle>
                        <AlertDescription className="text-green-700">
                          This salary record has been approved.
                          {selectedRecord.reviewedAt && (
                            <> Reviewed on {new Date(selectedRecord.reviewedAt).toLocaleString()}</>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {selectedRecord.status === 'REJECTED' && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Rejected</AlertTitle>
                        <AlertDescription>
                          This salary record has been rejected.
                          {selectedRecord.reviewComments && (
                            <p className="mt-2 italic">Reason: {selectedRecord.reviewComments}</p>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <label htmlFor="review-comments" className="text-sm font-medium">
                        Review Comments {selectedRecord.status !== 'APPROVED' && '(Required for rejection)'}
                      </label>
                      <Textarea
                        id="review-comments"
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                        placeholder="Add comments about this salary record..."
                        rows={3}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleApprove}
                        disabled={isSubmitting || selectedRecord.status === 'APPROVED'}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ThumbsUp className="h-4 w-4 mr-2" />
                        )}
                        Approve
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={isSubmitting || !reviewComments.trim() || selectedRecord.status === 'REJECTED'}
                        variant="destructive"
                        className="flex-1"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ThumbsDown className="h-4 w-4 mr-2" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select an employee from the list to review their salary record.
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="flex flex-col gap-2 border-t py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">
            {pendingCount} pending • {approvedCount} approved • {rejectedCount} rejected
          </p>
          <div className="flex flex-wrap gap-2">
            <DrawerClose asChild>
              <Button variant="outline" size="sm">
                Close
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default ReviewDrawer
