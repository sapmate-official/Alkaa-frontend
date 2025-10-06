import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, ArrowUpRight, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import { SalaryDispute } from '../../../types/payroll'
import { formatCurrency } from '../../utils/ui'

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    if (data?.message) {
      return data.message
    }
    return error.message || fallback
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  return fallback
}

type MonthOption = {
  value: number
  label: string
}

type DisputeStatus = SalaryDispute['status']

const STATUS_META: Record<DisputeStatus, { label: string; badgeClass: string }> = {
  PENDING: { label: 'Pending', badgeClass: 'border-amber-200 bg-amber-50 text-amber-700' },
  UNDER_REVIEW: { label: 'Under review', badgeClass: 'border-blue-200 bg-blue-50 text-blue-700' },
  RESOLVED: { label: 'Resolved', badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  REJECTED: { label: 'Rejected', badgeClass: 'border-red-200 bg-red-50 text-red-700' }
}

type DisputeManagementTabProps = {
  activeTab: string
  months: MonthOption[]
  onInspectDisputeRecord: (payload: {
    cycleId?: string | null
    salaryRecordId: string
    employeeId?: string | null
  }) => void
}

type StatusSummary = Partial<Record<DisputeStatus | 'total', number>>

type UpdateDialogState = {
  open: boolean
  dispute: SalaryDispute | null
  status: DisputeStatus
  note: string
  error: string | null
}

const PAGE_SIZE = 10

const requiresResolutionNote = (status: DisputeStatus) => status === 'RESOLVED' || status === 'REJECTED'

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString()
}

const DisputeManagementTab = ({ activeTab, months, onInspectDisputeRecord }: DisputeManagementTabProps) => {
  const isActive = activeTab === 'disputes'
  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => Array.from({ length: 5 }, (_, index) => currentYear - index), [currentYear])

  const [disputes, setDisputes] = useState<SalaryDispute[]>([])
  const [page, setPage] = useState(1)
  const pageSize = PAGE_SIZE
  const [paginationSummary, setPaginationSummary] = useState<{ totalPages: number; total: number }>({
    totalPages: 0,
    total: 0
  })
  const [statusSummary, setStatusSummary] = useState<StatusSummary>({})
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [selectedStatus, setSelectedStatus] = useState<'ALL' | DisputeStatus>('ALL')
  const [selectedMonth, setSelectedMonth] = useState('ALL')
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear))
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const [updateDialog, setUpdateDialog] = useState<UpdateDialogState>({
    open: false,
    dispute: null,
    status: 'PENDING',
    note: '',
    error: null
  })
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage((prev) => (prev === 1 ? prev : 1))
      setAppliedSearch(searchTerm.trim())
    }, 400)

    return () => {
      clearTimeout(timer)
    }
  }, [searchTerm])

  const fetchDisputes = useCallback(async () => {
    if (!isActive) {
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const params: Record<string, string | number> = {
        page,
        pageSize
      }

      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus
      }

      if (selectedMonth !== 'ALL') {
        params.month = Number(selectedMonth)
      }

      if (selectedYear !== 'ALL') {
        params.year = Number(selectedYear)
      }

      if (appliedSearch) {
        params.search = appliedSearch
      }

      const response = await axios.get(APIV3Dictionary.payroll.disputes.admin.list, {
        params,
        withCredentials: true
      })

      const payload = response.data as {
        success?: boolean
        data?: SalaryDispute[]
        message?: string
        pagination?: {
          page?: number
          pageSize?: number
          totalPages?: number
          total?: number
        }
        statusSummary?: StatusSummary
      }

      if (payload?.success === false) {
        throw new Error(payload.message || 'Failed to load salary disputes.')
      }

      const disputeList = Array.isArray(payload?.data) ? payload.data : []
      const paginationInfo = payload.pagination ?? {}
      setDisputes(disputeList)
      setStatusSummary(payload.statusSummary ?? {})

      const derivedTotal = paginationInfo.total ?? disputeList.length
      const derivedPageSize = paginationInfo.pageSize ?? pageSize
      const derivedTotalPages =
        paginationInfo.totalPages ??
        (derivedTotal > 0 ? Math.ceil(derivedTotal / derivedPageSize) : 0)

      setPaginationSummary({
        totalPages: derivedTotalPages,
        total: derivedTotal
      })

      if (typeof paginationInfo.page === 'number' && paginationInfo.page !== page) {
        setPage(paginationInfo.page)
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load salary disputes.')
      setErrorMessage(message)
      toast({
        title: 'Unable to load disputes',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, isActive, page, pageSize, selectedMonth, selectedStatus, selectedYear, toast])

  useEffect(() => {
    if (!isActive) {
      return
    }
    fetchDisputes()
  }, [page, pageSize, fetchDisputes, isActive])

  const totalCount = statusSummary.total ?? 0
  const summaryItems = useMemo(
    () => (
      [
        'PENDING',
        'UNDER_REVIEW',
        'RESOLVED',
        'REJECTED'
      ] as DisputeStatus[]
    ).map((status) => ({
      status,
      label: STATUS_META[status].label,
      count: statusSummary[status] ?? 0
    })),
    [statusSummary]
  )

  const handleResetFilters = () => {
    setSelectedStatus('ALL')
    setSelectedMonth('ALL')
    setSelectedYear(String(currentYear))
    setSearchTerm('')
    setAppliedSearch('')
    setPage(1)
  }

  const openUpdateDialog = (dispute: SalaryDispute) => {
    setUpdateDialog({
      open: true,
      dispute,
      status: dispute.status,
      note: dispute.resolutionNote ?? '',
      error: null
    })
  }

  const closeUpdateDialog = () => {
    setUpdateDialog({
      open: false,
      dispute: null,
      status: 'PENDING',
      note: '',
      error: null
    })
  }

  const handleSubmitUpdate = async () => {
    if (!updateDialog.dispute) {
      return
    }

    const trimmedNote = updateDialog.note.trim()
    if (requiresResolutionNote(updateDialog.status) && !trimmedNote) {
      setUpdateDialog((prev) => ({ ...prev, error: 'Resolution note is required for this status.' }))
      return
    }

    setIsSubmittingUpdate(true)
    setUpdateDialog((prev) => ({ ...prev, error: null }))

    try {
      await axios.patch(
        APIV3Dictionary.payroll.disputes.admin.update(updateDialog.dispute.id),
        {
          status: updateDialog.status,
          ...(trimmedNote ? { resolutionNote: trimmedNote } : {})
        },
        { withCredentials: true }
      )

      toast({
        title: 'Dispute updated',
        description: `Marked dispute #${updateDialog.dispute.id} as ${STATUS_META[updateDialog.status].label.toLowerCase()}.`
      })

      closeUpdateDialog()
      await fetchDisputes()
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update dispute.')
      setUpdateDialog((prev) => ({ ...prev, error: message }))
      toast({
        title: 'Update failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsSubmittingUpdate(false)
    }
  }

  const handleInspectRecord = (dispute: SalaryDispute) => {
    const cycleId = dispute.cycle?.id ?? dispute.salaryRecord?.cycleId ?? null
    const employeeId = dispute.employee?.id ?? dispute.userId ?? dispute.employee?.employeeId ?? null

    if (!cycleId) {
      toast({
        title: 'Cycle information unavailable',
        description: 'This dispute is not linked to a payroll cycle yet. Generate or sync the salary record before inspecting processing steps.',
        variant: 'destructive'
      })
      return
    }

    onInspectDisputeRecord({
      cycleId,
      salaryRecordId: dispute.salaryRecordId,
      employeeId
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Salary Dispute Center
          </CardTitle>
          <CardDescription>
            Track, review, and resolve salary disputes raised across the organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          {summaryItems.map((item) => (
            <div key={item.status} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </span>
                <Badge variant="outline" className={STATUS_META[item.status].badgeClass}>
                  {item.label}
                </Badge>
              </div>
              <p className="mt-3 text-2xl font-semibold">{item.count}</p>
            </div>
          ))}
          <div className="rounded-lg border p-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Total disputes
            </span>
            <p className="mt-3 text-2xl font-semibold">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Across all filters</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Limit results by status, payroll period, or employee details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Status</span>
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                setPage(1)
                setSelectedStatus(value as 'ALL' | DisputeStatus)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {(Object.keys(STATUS_META) as DisputeStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_META[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Month</span>
            <Select
              value={selectedMonth}
              onValueChange={(value) => {
                setPage(1)
                setSelectedMonth(value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All months</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={String(month.value)}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Year</span>
            <Select
              value={selectedYear}
              onValueChange={(value) => {
                setPage(1)
                setSelectedYear(value)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All years</SelectItem>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Search</span>
            <Input
              placeholder="Search by employee name, ID, or reason"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="md:col-span-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {disputes.length} of {paginationSummary.total} disputes
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Reset filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Open disputes</CardTitle>
          <CardDescription>
            Review escalations and take action. Use the update action to move disputes through the workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Failed to load disputes</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Payroll period</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Filed</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-20 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  : disputes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="h-6 w-6" />
                            <span>No disputes found for the selected filters.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      disputes.map((dispute) => {
                        const statusMeta = STATUS_META[dispute.status]
                        const employeeName = [dispute.employee?.firstName, dispute.employee?.lastName]
                          .filter(Boolean)
                          .join(' ') || 'Employee'
                        const employeeId = dispute.employee?.employeeId || '—'
                        const monthLabel = dispute.salaryRecord?.month
                          ? months.find((month) => month.value === dispute.salaryRecord?.month)?.label ?? `Month ${dispute.salaryRecord?.month}`
                          : dispute.cycle?.month
                            ? months.find((month) => month.value === dispute.cycle?.month)?.label ?? `Month ${dispute.cycle?.month}`
                            : '—'
                        const yearValue = dispute.salaryRecord?.year ?? dispute.cycle?.year ?? '—'
                        const amount = typeof dispute.salaryRecord?.netSalary === 'number' ? formatCurrency(dispute.salaryRecord?.netSalary) : '—'

                        return (
                          <TableRow key={dispute.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium leading-none">{employeeName}</p>
                                <p className="text-xs text-muted-foreground">ID: {employeeId}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <p>{monthLabel} {yearValue}</p>
                                <p className="text-xs text-muted-foreground">Net salary: {amount}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <p className="font-medium">{dispute.reason}</p>
                                {dispute.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">{dispute.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusMeta.badgeClass}>
                                {statusMeta.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(dispute.createdAt)}</TableCell>
                            <TableCell>{formatDateTime(dispute.updatedAt ?? dispute.resolvedAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleInspectRecord(dispute)}
                                >
                                  View record
                                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" onClick={() => openUpdateDialog(dispute)}>
                                  Update status
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page} of {Math.max(paginationSummary.totalPages, 1)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= paginationSummary.totalPages || isLoading || paginationSummary.totalPages === 0}
                onClick={() => setPage((prev) => (paginationSummary.totalPages === 0 ? prev : Math.min(prev + 1, paginationSummary.totalPages)))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={updateDialog.open} onOpenChange={(open) => (open ? void 0 : closeUpdateDialog())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update dispute status</DialogTitle>
            <DialogDescription>
              Choose a new status and capture the resolution detail so employees can see the outcome.
            </DialogDescription>
          </DialogHeader>

          {updateDialog.dispute && (
            <div className="space-y-4">
              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium">Dispute #{updateDialog.dispute.id}</p>
                <p className="text-xs text-muted-foreground">
                  {updateDialog.dispute.reason}
                  {updateDialog.dispute.description ? ` • ${updateDialog.dispute.description}` : ''}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <Select
                  value={updateDialog.status}
                  onValueChange={(value) =>
                    setUpdateDialog((prev) => ({ ...prev, status: value as DisputeStatus, error: null }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_META) as DisputeStatus[]).map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_META[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>Resolution note</span>
                  {requiresResolutionNote(updateDialog.status) && <span className="text-red-500">Required</span>}
                </div>
                <Textarea
                  placeholder="Document what changed or how the dispute was resolved"
                  value={updateDialog.note}
                  onChange={(event) =>
                    setUpdateDialog((prev) => ({ ...prev, note: event.target.value, error: null }))
                  }
                  minLength={10}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Employees see this note in their self-service portal.
                </p>
              </div>

              {updateDialog.error && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to update dispute</AlertTitle>
                  <AlertDescription>{updateDialog.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={closeUpdateDialog} disabled={isSubmittingUpdate}>
              Cancel
            </Button>
            <Button onClick={handleSubmitUpdate} disabled={isSubmittingUpdate}>
              {isSubmittingUpdate ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DisputeManagementTab
