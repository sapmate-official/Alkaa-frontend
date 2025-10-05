import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useAtom } from 'jotai'
import {
  BarChart3,
  Building2,
  Download,
  IndianRupee,
  Loader2,
  RefreshCw,
  Search,
  Trophy,
  Users2
} from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import { permissionListAtom } from '@/store/atom'
import CheckPermission from '@/services/PermissionCheck'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const HISTORY_OPTIONS = [3, 6, 12, 18, 24] as const
const STATUS_OPTIONS = ['all', 'APPROVED', 'PROCESSED', 'PAID'] as const
const PAYMENT_STATUS_OPTIONS = ['all', 'COMPLETED', 'INITIATED', 'PENDING', 'FAILED'] as const

type StatusOption = (typeof STATUS_OPTIONS)[number]
type PaymentStatusOption = (typeof PAYMENT_STATUS_OPTIONS)[number]

type TaxSummaryPeriod = {
  month: number
  year: number
  totalTax: number
  totalNetSalary: number
  totalGross: number
  recordCount: number
  employeeCount: number
  averageTax: number
  paymentStatusBreakdown?: Record<string, number>
  statusBreakdown?: Record<string, number>
}

type TaxSummaryEmployee = {
  userId: string
  employeeName: string
  employeeId: string | null
  departmentName: string | null
  totalTax: number
  netSalary: number
  recordCount: number
  averageTax: number
}

type TaxSummaryDepartment = {
  departmentId: string | null
  departmentName: string
  totalTax: number
  totalNetSalary: number
  totalGross: number
  recordCount: number
  employeeCount: number
  averageTax: number
}

type TaxSummaryTotals = {
  totalTax: number
  totalNetSalary: number
  totalGross: number
  recordCount: number
  uniqueEmployees: number
  averageTaxPerEmployee: number
  averageTaxPerRecord: number
}

type TaxSummaryPayload = {
  periods: TaxSummaryPeriod[]
  totals: TaxSummaryTotals
  topEmployees: TaxSummaryEmployee[]
  departmentBreakdown: TaxSummaryDepartment[]
  paymentStatusBreakdown: Record<string, number>
  statusBreakdown: Record<string, number>
}

type TaxSummaryMeta = {
  months: number
  filters: {
    statuses: string[]
    paymentStatuses: string[]
    departmentIds: string[]
    search: string | null
    minTax: number | null
    maxTax: number | null
  }
  range: {
    from: { month: number; year: number } | null
    to: { month: number; year: number } | null
  }
}

type TaxSummaryResponse = {
  success: boolean
  data: TaxSummaryPayload
  meta: TaxSummaryMeta
  generatedAt?: string
  message?: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(value)
}

const getMonthName = (month: number) => {
  return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'short' })
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

const OrganizationTaxSummaries = () => {
  const { toast } = useToast()
  const [permissionList] = useAtom(permissionListAtom)
  const canViewSummaries = useMemo(
    () => CheckPermission('view_salary_slip_of_all', permissionList),
    [permissionList]
  )

  const [historyMonths, setHistoryMonths] = useState<number>(6)
  const [statusFilter, setStatusFilter] = useState<StatusOption>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusOption>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [dataset, setDataset] = useState<TaxSummaryPayload | null>(null)
  const [meta, setMeta] = useState<TaxSummaryMeta | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
    }, 400)

    return () => window.clearTimeout(handle)
  }, [searchTerm])

  const fetchSummaries = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false
      if (!silent) {
        setIsLoading(true)
      }
      setLoadError(null)

      try {
        const params: Record<string, string> = {
          months: historyMonths.toString()
        }

        if (statusFilter !== 'all') {
          params.status = statusFilter
        }

        if (paymentStatusFilter !== 'all') {
          params.paymentStatus = paymentStatusFilter
        }

        if (debouncedSearch) {
          params.search = debouncedSearch
        }

        const response = await axios.get<TaxSummaryResponse>(
          APIV3Dictionary.payroll.admin.taxSummaries,
          {
            params,
            withCredentials: true
          }
        )

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch tax summaries')
        }

        setDataset(response.data.data)
        setMeta(response.data.meta)
        setGeneratedAt(response.data.generatedAt ?? new Date().toISOString())
      } catch (error) {
        const message = getErrorMessage(error, 'Unable to load organization tax summaries')
        setLoadError(message)
        setDataset(null)
        toast({
          title: 'Fetch failed',
          description: message,
          variant: 'destructive'
        })
      } finally {
        if (silent) {
          setIsRefreshing(false)
        } else {
          setIsLoading(false)
        }
      }
    },
    [debouncedSearch, historyMonths, paymentStatusFilter, statusFilter, toast]
  )

  useEffect(() => {
    if (!canViewSummaries) {
      setIsLoading(false)
      return
    }
    void fetchSummaries()
  }, [canViewSummaries, fetchSummaries])

  const handleRefresh = () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    void fetchSummaries({ silent: true })
  }

  const handleExport = () => {
    if (!dataset || dataset.periods.length === 0) {
      toast({
        title: 'No data to export',
        description: 'Generate a summary first before exporting.',
        variant: 'default'
      })
      return
    }

    const headers = [
      'Month',
      'Year',
      'Total Tax',
      'Total Net Salary',
      'Total Gross',
      'Average Tax',
      'Employees Covered',
      'Records Count'
    ]

    const rows = dataset.periods.map((period) => [
      getMonthName(period.month),
      period.year.toString(),
      period.totalTax.toFixed(2),
      period.totalNetSalary.toFixed(2),
      period.totalGross.toFixed(2),
      period.averageTax.toFixed(2),
      period.employeeCount.toString(),
      period.recordCount.toString()
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'organization-tax-summaries.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Export complete',
      description: 'A CSV with the monthly tax summary has been downloaded.'
    })
  }

  const totals = dataset?.totals
  const periods = dataset?.periods ?? []
  const topEmployees = dataset?.topEmployees ?? []
  const departments = dataset?.departmentBreakdown ?? []

  const rangeLabel = useMemo(() => {
    if (!meta?.range?.from || !meta.range.to) return null
    const from = `${getMonthName(meta.range.from.month)} ${meta.range.from.year}`
    const to = `${getMonthName(meta.range.to.month)} ${meta.range.to.year}`
    return `${from} – ${to}`
  }, [meta])

  if (!canViewSummaries) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insufficient permissions</CardTitle>
          <CardDescription>
            You need the "view all salary slips" permission to view organization-wide tax summaries.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="min-h-[320px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  if (loadError) {
    return (
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Unable to load tax summaries</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => fetchSummaries()} variant="outline">
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full min-h-screen max-w-full overflow-y-auto space-y-6 pb-8 pr-2 sm:pr-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organization Tax Summaries</h1>
          <p className="text-sm text-muted-foreground">
            Consolidated tax deductions, payouts, and department exposure across recent payroll periods.
          </p>
          {rangeLabel ? (
            <p className="text-xs text-muted-foreground mt-1">Reporting window: {rangeLabel}</p>
          ) : null}
          {generatedAt ? (
            <p className="text-xs text-muted-foreground">Generated at {new Date(generatedAt).toLocaleString()}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
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
          <Button onClick={handleExport} disabled={!dataset || periods.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Adjust the reporting window and filters to refine the summary.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">History window</span>
            <Select value={historyMonths.toString()} onValueChange={(value) => setHistoryMonths(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select months" />
              </SelectTrigger>
              <SelectContent>
                {HISTORY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    Last {option} months
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Payroll status</span>
            <Select value={statusFilter} onValueChange={(value: StatusOption) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === 'all' ? 'All statuses' : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Payment status</span>
            <Select
              value={paymentStatusFilter}
              onValueChange={(value: PaymentStatusOption) => setPaymentStatusFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All payments" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === 'all' ? 'All payments' : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Search by employee or department</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search names, IDs, or teams"
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {totals ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total tax collected</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatCurrency(totals.totalTax)}</div>
              <p className="text-xs text-muted-foreground">Across {formatNumber(totals.recordCount)} records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average tax per employee</CardTitle>
              <Users2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatCurrency(totals.averageTaxPerEmployee || 0)}</div>
              <p className="text-xs text-muted-foreground">{formatNumber(totals.uniqueEmployees)} employees impacted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payroll net paid</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatCurrency(totals.totalNetSalary)}</div>
              <p className="text-xs text-muted-foreground">Average tax per record {formatCurrency(totals.averageTaxPerRecord || 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross payroll captured</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatCurrency(totals.totalGross)}</div>
              <p className="text-xs text-muted-foreground">Net of deductions: {formatCurrency(totals.totalNetSalary)}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Monthly breakdown</CardTitle>
            <CardDescription>Track how deductions and payouts trend across the selected window.</CardDescription>
          </CardHeader>
          <CardContent>
            {periods.length === 0 ? (
              <p className="text-sm text-muted-foreground">No records found for the selected filters.</p>
            ) : (
              <ScrollArea className="h-[360px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Net salary</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Employees</TableHead>
                      <TableHead className="text-right">Records</TableHead>
                      <TableHead className="text-right">Avg tax</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periods.map((period) => (
                      <TableRow key={`${period.year}-${period.month}`}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {getMonthName(period.month)} {period.year}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatNumber(period.employeeCount)} employees
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(period.totalTax)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(period.totalNetSalary)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(period.totalGross)}</TableCell>
                        <TableCell className="text-right">{formatNumber(period.employeeCount)}</TableCell>
                        <TableCell className="text-right">{formatNumber(period.recordCount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(period.averageTax || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Top contributors</CardTitle>
            <CardDescription>Employees with the highest tax deductions in the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            {topEmployees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No employee records available for the current filters.</p>
            ) : (
              <ScrollArea className="h-[360px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Total tax</TableHead>
                      <TableHead className="text-right">Net salary</TableHead>
                      <TableHead className="text-right">Avg tax</TableHead>
                      <TableHead className="text-right">Records</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topEmployees.map((employee, index) => (
                      <TableRow key={employee.userId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? 'default' : 'secondary'} className="flex items-center gap-1">
                              <Trophy className="h-3 w-3" />
                              {index + 1}
                            </Badge>
                            <div className="flex flex-col">
                              <span className="font-medium">{employee.employeeName}</span>
                              {employee.employeeId ? (
                                <span className="text-xs text-muted-foreground">{employee.employeeId}</span>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.departmentName ?? '—'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(employee.totalTax)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(employee.netSalary)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(employee.averageTax || 0)}</TableCell>
                        <TableCell className="text-right">{formatNumber(employee.recordCount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department exposure</CardTitle>
          <CardDescription>Compare how different teams contribute to the overall tax deductions.</CardDescription>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No department data available.</p>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Total tax</TableHead>
                    <TableHead className="text-right">Net salary</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Employees</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department) => (
                    <TableRow key={department.departmentId ?? department.departmentName}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{department.departmentName}</span>
                          {department.departmentId ? (
                            <span className="text-xs text-muted-foreground">{department.departmentId}</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(department.totalTax)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(department.totalNetSalary)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(department.totalGross)}</TableCell>
                      <TableCell className="text-right">{formatNumber(department.employeeCount)}</TableCell>
                      <TableCell className="text-right">{formatNumber(department.recordCount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance snapshot</CardTitle>
          <CardDescription>Quick view of payment progress and payroll statuses.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold">Payment status</h4>
            <Separator className="my-2" />
            <div className="flex flex-wrap gap-2">
              {Object.entries(dataset?.paymentStatusBreakdown ?? {}).map(([status, count]) => (
                <Badge key={status} variant="secondary" className="flex items-center gap-2">
                  <span className="uppercase text-xs">{status}</span>
                  <span className="text-xs font-semibold">{formatNumber(count)}</span>
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Payroll status</h4>
            <Separator className="my-2" />
            <div className="flex flex-wrap gap-2">
              {Object.entries(dataset?.statusBreakdown ?? {}).map(([status, count]) => (
                <Badge key={status} variant="outline" className="flex items-center gap-2">
                  <span className="uppercase text-xs">{status}</span>
                  <span className="text-xs font-semibold">{formatNumber(count)}</span>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrganizationTaxSummaries
