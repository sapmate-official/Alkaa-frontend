import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useAtom } from 'jotai'
import {
  AlertTriangle,
  CheckCircle2,
  DownloadCloud,
  FileText,
  History,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import { permissionListAtom } from '@/store/atom'
import CheckPermission from '@/services/PermissionCheck'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import { PayslipData } from '@/types/general'
import PayslipDetailedView, { PayslipStatistics } from '../ViewPayslipOfAllUsersPayroll/PayslipDetailedView'
import { usePayslipPDF } from '@/hooks/usePayslipPDF'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const HISTORY_OPTIONS = [3, 6, 12]
const STATUS_FILTERS = ['all', 'PAID', 'PROCESSED', 'PENDING'] as const

type HistoryMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  months: number
}

const getMonthName = (month: number) => {
  return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleString()
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as Record<string, unknown> | undefined
    if (responseData && typeof responseData.message === 'string') {
      return responseData.message
    }
    return error.message || fallback
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  return fallback
}

type StatusFilter = (typeof STATUS_FILTERS)[number]

type EnrichedPayslipRecord = PayslipData & {
  employeeName: string
  paymentStatus?: string | null
  paymentStatusLabel: string
  processedAtDate: Date | null
}

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
    case 'PROCESSED':
      return 'bg-amber-100 text-amber-700 hover:bg-amber-100'
    case 'PENDING':
    default:
      return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
  }
}

const paymentBadgeClass = (status?: string | null) => {
  if (!status) {
    return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
  }

  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
    case 'INITIATED':
      return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
    case 'FAILED':
      return 'bg-red-100 text-red-700 hover:bg-red-100'
    case 'NO_PAYOUT_REQUIRED':
      return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
    case 'PENDING':
    default:
      return 'bg-amber-100 text-amber-700 hover:bg-amber-100'
  }
}

const OrganizationPayslipHistory = () => {
  const { toast } = useToast()
  const [permissionList] = useAtom(permissionListAtom)
  const canViewAll = useMemo(
    () => CheckPermission('view_salary_slip_of_all', permissionList),
    [permissionList]
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [historyMonths, setHistoryMonths] = useState<number>(6)
  const [records, setRecords] = useState<EnrichedPayslipRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<EnrichedPayslipRecord | null>(null)
  const [statistics, setStatistics] = useState<PayslipStatistics | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const statisticsCacheRef = useRef<Record<string, PayslipStatistics>>({})
  const { generatePayslipPDF, isGenerating } = usePayslipPDF()

  const buildEmployeeName = (record: PayslipData) => {
    const first = record.employee?.firstName ?? ''
    const last = record.employee?.lastName ?? ''
    const full = `${first} ${last}`.trim()
    return full || record.employee?.employeeId || record.userId || 'Employee'
  }

  const normalizePaymentStatus = (status?: string | null) => {
    if (!status) return 'Pending'
    const label = status.replace(/_/g, ' ').toLowerCase()
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  const hydrateRecord = (record: PayslipData): EnrichedPayslipRecord => {
    const processedAtDate = record.processedAt ? new Date(record.processedAt) : null
    const rawPaymentStatus = (record as { paymentStatus?: string | null }).paymentStatus ?? null
    return {
      ...record,
      employeeName: buildEmployeeName(record),
      paymentStatus: rawPaymentStatus,
      paymentStatusLabel: normalizePaymentStatus(rawPaymentStatus),
      processedAtDate
    }
  }

  const formatPaymentStatus = (record: EnrichedPayslipRecord) => {
    if (!record.paymentStatus && !record.paymentMode && !record.paymentRef) {
      return 'Not recorded'
    }
    return record.paymentStatusLabel
  }

  const [historyMeta, setHistoryMeta] = useState<HistoryMeta | null>(null)

  const fetchPayslipHistory = useCallback(async () => {
    if (!canViewAll) {
      return
    }

    setIsLoading(true)
    setLoadError(null)

    try {
      const response = await axios.get(
        APIV3Dictionary.payroll.admin.payslipHistory,
        {
          params: {
            months: historyMonths,
            page: 1,
            pageSize: 500
          },
          withCredentials: true
        }
      )

      const payload = response.data as {
        success?: boolean
        data?: PayslipData[]
        meta?: HistoryMeta | null
        message?: string
      }

      if (payload?.success && Array.isArray(payload.data)) {
        const hydrated = payload.data.map((entry) => hydrateRecord(entry))
        hydrated.sort((a, b) => {
          const dateA = a.processedAtDate?.getTime() ?? new Date(a.year, a.month - 1).getTime()
          const dateB = b.processedAtDate?.getTime() ?? new Date(b.year, b.month - 1).getTime()
          return dateB - dateA
        })

        statisticsCacheRef.current = {}
        setRecords(hydrated)
        setHistoryMeta(payload.meta ?? null)
      } else {
        const message = payload?.message ?? 'Failed to load payslip history.'
        setRecords([])
        setHistoryMeta(null)
        setLoadError(message)
        toast({
          title: 'Failed to load payslip history',
          description: message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to fetch payslip history.')
      setRecords([])
      setHistoryMeta(null)
      setLoadError(message)
      toast({
        title: 'Failed to load payslip history',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [canViewAll, historyMonths, toast])

  useEffect(() => {
    void fetchPayslipHistory()
  }, [fetchPayslipHistory])

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return records.filter((record) => {
      const matchesStatus =
        statusFilter === 'all' ? true : record.status === statusFilter

      const matchesSearch =
        !search ||
        record.employeeName.toLowerCase().includes(search) ||
        (record.employee?.employeeId ?? '').toLowerCase().includes(search) ||
        (record.employee?.department ?? '').toLowerCase().includes(search) ||
        getMonthName(record.month).toLowerCase().includes(search)

      return matchesStatus && matchesSearch
    })
  }, [records, searchTerm, statusFilter])

  const summary = useMemo(() => {
    const total = records.length
    const paid = records.filter((record) => record.status === 'PAID').length
    const processed = records.filter((record) => record.status === 'PROCESSED').length
    const pending = records.filter((record) => record.status === 'PENDING').length

    const lastProcessed = records.reduce<Date | null>((latest, record) => {
      if (!record.processedAtDate) return latest
      if (!latest) return record.processedAtDate
      return record.processedAtDate > latest ? record.processedAtDate : latest
    }, null)

    return {
      total,
      paid,
      processed,
      pending,
      lastProcessed
    }
  }, [records])

  const handleRefresh = () => {
    setIsRefreshing(true)
    void fetchPayslipHistory()
  }

  const handleHistoryChange = (value: string) => {
    const months = Number(value)
    if (!Number.isNaN(months)) {
      setHistoryMonths(months)
    }
  }

  const handleOpenDetails = async (record: EnrichedPayslipRecord) => {
    setSelectedRecord(record)
    setIsDetailsOpen(true)
    setDetailsError(null)
    setStatistics(null)

    if (statisticsCacheRef.current[record.id]) {
      setStatistics(statisticsCacheRef.current[record.id])
      return
    }

    setIsDetailsLoading(true)

    try {
      const response = await axios.get(APIV3Dictionary.payroll.getStatistics(record.id), {
        withCredentials: true
      })

      if (response.data?.success && response.data?.data) {
        statisticsCacheRef.current[record.id] = response.data.data
        setStatistics(response.data.data)
      } else {
        const message = response.data?.message || 'Failed to load payslip statistics.'
        setDetailsError(message)
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to load payslip details.')
      setDetailsError(message)
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const handleDownload = async (record: EnrichedPayslipRecord) => {
    try {
      await generatePayslipPDF(record.id)
      toast({
        title: 'Download ready',
        description: `Opened ${record.employeeName}'s payslip for ${getMonthName(record.month)} ${record.year}.`
      })
    } catch (error) {
      toast({
        title: 'Unable to download payslip',
        description: getErrorMessage(error, 'Failed to generate PDF. Please try again.'),
        variant: 'destructive'
      })
    }
  }

  const handleExport = () => {
    if (!filteredRecords.length) {
      toast({
        title: 'Nothing to export',
        description: 'Adjust filters to include at least one payslip record.'
      })
      return
    }

    const headers = [
      'Employee Name',
      'Employee ID',
      'Department',
      'Month',
      'Year',
      'Status',
      'Payment Status',
      'Net Salary',
      'Processed At'
    ]

    const rows = filteredRecords.map((record) => [
      record.employeeName,
      record.employee?.employeeId ?? 'N/A',
      record.employee?.department ?? 'N/A',
      getMonthName(record.month),
      record.year,
      record.status,
      formatPaymentStatus(record),
      record.netSalary,
      record.processedAt ? new Date(record.processedAt).toISOString() : ''
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'organization-payslip-history.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Export started',
      description: 'Payslip history CSV is downloading.'
    })
  }

  if (!canViewAll) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <Card className="max-w-xl border-red-200 bg-red-50">
          <CardHeader className="flex items-start gap-3">
            <div className="rounded-md bg-red-100 p-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Restricted Access</CardTitle>
              <CardDescription>
                You do not have permission to view organization-wide payslip history.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Please contact your administrator to request the
            <Badge variant="secondary" className="mx-2">
              view_salary_slip_of_all
            </Badge>
            permission.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Organization Payslip History</h1>
              <p className="text-sm text-muted-foreground">
                Audit, search, and download payslips across every payroll cycle.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={historyMonths.toString()} onValueChange={handleHistoryChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="History range" />
                </SelectTrigger>
                <SelectContent>
                  {HISTORY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      Last {option} month{option === 1 ? '' : 's'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExport}
                disabled={!filteredRecords.length}
              >
                <DownloadCloud className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <History className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total}</div>
                <p className="text-xs text-muted-foreground">Captured payslips</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{summary.paid}</div>
                <p className="text-xs text-muted-foreground">Fully settled records</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
                <FileText className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{summary.processed}</div>
                <p className="text-xs text-muted-foreground">Awaiting payout</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{summary.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Last updated: {summary.lastProcessed ? summary.lastProcessed.toLocaleString() : '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search by employee, ID, department, or month"
                      className="pl-9"
                    />
                  </div>
                  <Separator orientation="vertical" className="hidden h-8 lg:block" />
                  <div className="flex gap-2">
                    {STATUS_FILTERS.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        size="sm"
                        variant={statusFilter === option ? 'default' : 'outline'}
                        onClick={() => setStatusFilter(option)}
                      >
                        {option === 'all' ? 'All' : option.charAt(0) + option.slice(1).toLowerCase()}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Showing {filteredRecords.length} of {historyMeta?.total ?? records.length} records
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table className="w-full min-w-[960px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="w-[160px]">Processed</TableHead>
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-40 text-center text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading payslip history...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-40 text-center text-sm text-muted-foreground">
                        {loadError ?? 'No payslip records match the current filters.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="font-medium">{record.employeeName}</div>
                          <div className="text-xs text-muted-foreground">
                            {record.employee?.designation ?? ''}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {record.employee?.employeeId ?? 'N/A'}
                        </TableCell>
                        <TableCell>{record.employee?.department ?? 'N/A'}</TableCell>
                        <TableCell>{getMonthName(record.month)} {record.year}</TableCell>
                        <TableCell>{formatCurrency(record.netSalary)}</TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClass(record.status)}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={paymentBadgeClass(record.paymentStatus)}>
                            {formatPaymentStatus(record)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(record.processedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDetails(record)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(record)}
                              disabled={isGenerating}
                            >
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open)
          if (!open) {
            setSelectedRecord(null)
            setStatistics(null)
            setDetailsError(null)
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-3xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord
                ? `${selectedRecord.employeeName} · ${getMonthName(selectedRecord.month)} ${selectedRecord.year}`
                : 'Payslip details'}
            </DialogTitle>
            <DialogDescription>
              Detailed salary, attendance, and compliance breakdown for the selected employee.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            {isDetailsLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading payslip details…
              </div>
            ) : detailsError ? (
              <div className="space-y-4 py-4">
                <Card className="border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                  <CardTitle className="mb-2 text-base">Unable to load details</CardTitle>
                  <CardDescription className="text-sm text-destructive">
                    {detailsError}
                  </CardDescription>
                </Card>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => selectedRecord && handleOpenDetails(selectedRecord)}>
                    Retry
                  </Button>
                </div>
              </div>
            ) : statistics && selectedRecord ? (
              <ScrollArea className="pr-3">
                <PayslipDetailedView statistics={statistics} payslip={selectedRecord} />
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                Select a payslip to inspect detailed information.
              </div>
            )}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrganizationPayslipHistory
