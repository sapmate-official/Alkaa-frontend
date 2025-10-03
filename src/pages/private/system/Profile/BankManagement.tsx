import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAtom } from 'jotai'
import { permissionListAtom } from '@/store/atom'
import {
  useAllBankDetailsQuery,
  OrganizationBankDetailsRecord,
} from '@/hooks/queries/useProfile'
import { useToast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import {
  AlertTriangle,
  DownloadCloud,
  Eye,
  EyeOff,
  Loader2,
  PenSquare,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import RouteDict from '@/routes/RouteDict'

const ACCOUNT_FIELDS = ['accountNumber', 'bankName', 'ifscCode'] as const

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleString()
}

type FilterOption = 'all' | 'complete' | 'incomplete'

type EnrichedBankRecord = OrganizationBankDetailsRecord & {
  isComplete: boolean
  missingFields: string[]
  lastUpdatedAt: string | null
}

const BankManagement = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [permissionList] = useAtom(permissionListAtom)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterOption>('all')
  const [revealedRows, setRevealedRows] = useState<Record<string, boolean>>({})

  const canViewAll = useMemo(
    () => permissionList.some((permission) => permission.key === 'view_bank_all_user'),
    [permissionList]
  )
  const canEditAll = useMemo(
    () => permissionList.some((permission) => permission.key === 'update_bank_all_user'),
    [permissionList]
  )

  const {
    data = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAllBankDetailsQuery(canViewAll)

  useEffect(() => {
    if (error && canViewAll) {
      console.error('Failed to fetch organization bank details', error)
      toast({
        title: 'Unable to load bank details',
        description: 'Please try refreshing or check your permissions.',
        variant: 'destructive',
      })
    }
  }, [error, toast, canViewAll])

  const enrichedRecords = useMemo<EnrichedBankRecord[]>(() => {
    return data.map((record) => {
      const missingFields = ACCOUNT_FIELDS.filter((field) => {
        const value = record[field]
        return !value || (typeof value === 'string' && value.trim() === '')
      })

      return {
        ...record,
        isComplete: missingFields.length === 0,
        missingFields: missingFields.map((field) =>
          field === 'ifscCode'
            ? 'IFSC Code'
            : field === 'accountNumber'
            ? 'Account Number'
            : 'Bank Name'
        ),
        lastUpdatedAt: record.updatedAt ?? record.createdAt ?? null,
      }
    })
  }, [data])

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return enrichedRecords.filter((record) => {
      const matchesSearch =
        !search ||
        record.userId.toLowerCase().includes(search) ||
        (record.accountHolderName ?? '').toLowerCase().includes(search) ||
        (record.bankName ?? '').toLowerCase().includes(search) ||
        (record.accountNumber ?? '').toLowerCase().includes(search) ||
        record.ifscCode?.toLowerCase().includes(search)

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'complete'
          ? record.isComplete
          : !record.isComplete

      return matchesSearch && matchesStatus
    })
  }, [enrichedRecords, searchTerm, statusFilter])

  const summary = useMemo(() => {
    const total = enrichedRecords.length
    const complete = enrichedRecords.filter((record) => record.isComplete).length
    const lastUpdated = enrichedRecords.reduce<string | null>((acc, record) => {
      if (!record.lastUpdatedAt) return acc
      if (!acc) return record.lastUpdatedAt
      return new Date(record.lastUpdatedAt) > new Date(acc)
        ? record.lastUpdatedAt
        : acc
    }, null)

    return {
      total,
      complete,
      incomplete: total - complete,
      lastUpdated,
    }
  }, [enrichedRecords])

  const toggleRowVisibility = (id: string) => {
    setRevealedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const formatAccountNumber = (record: OrganizationBankDetailsRecord) => {
    const number = record.accountNumber
    if (!number) return 'Not provided'
    return revealedRows[record.id] ? number : `••••${number.slice(-4)}`
  }

  const handleExport = useCallback(() => {
    if (!enrichedRecords.length) {
      toast({
        title: 'Nothing to export yet',
        description: 'Add bank records before downloading a CSV.',
      })
      return
    }

    const headers = [
      'User ID',
      'Account Holder',
      'Bank Name',
      'Account Number',
      'IFSC Code',
      'Last Updated',
      'Status',
      'Missing Fields',
    ]

    const rows = enrichedRecords.map((record) => [
      record.userId,
      record.accountHolderName ?? 'Not provided',
      record.bankName ?? 'Not provided',
      record.accountNumber ?? 'Not provided',
      record.ifscCode ?? 'Not provided',
      record.lastUpdatedAt ? new Date(record.lastUpdatedAt).toISOString() : '—',
      record.isComplete ? 'Complete' : 'Incomplete',
      record.missingFields.join('; '),
    ])

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'organization-bank-details.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Export ready',
      description: 'Organization bank details have been downloaded.',
    })
  }, [enrichedRecords, toast])

  if (!canViewAll) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <Card className="max-w-xl border-red-200 bg-red-50">
          <CardHeader className="flex items-start gap-3">
            <div className="rounded-md bg-red-100 p-2 text-red-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Restricted Access</CardTitle>
              <CardDescription>
                You do not have permission to view organization-wide bank details.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Please contact your administrator to request the
            <Badge variant="secondary" className="mx-2">
              view_bank_all_user
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
              <h1 className="text-2xl font-semibold">Organization Bank Management</h1>
              <p className="text-sm text-muted-foreground">
                Audit, filter, and update bank accounts across the organization.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
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
                disabled={!enrichedRecords.length}
              >
                <DownloadCloud className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bank Records</CardTitle>
                <ShieldCheck className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total}</div>
                <p className="text-xs text-muted-foreground">Stored accounts</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Complete Records</CardTitle>
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{summary.complete}</div>
                <p className="text-xs text-muted-foreground">Ready for payouts</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Missing Information</CardTitle>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{summary.incomplete}</div>
                <p className="text-xs text-muted-foreground">
                  Last update: {formatDateTime(summary.lastUpdated)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by user, account holder, bank, or IFSC"
                    className="max-w-md"
                  />
                  <Separator orientation="vertical" className="hidden h-8 lg:block" />
                  <div className="flex gap-2">
                    {(['all', 'complete', 'incomplete'] as FilterOption[]).map((option) => (
                      <Button
                        key={option}
                        type="button"
                        size="sm"
                        variant={statusFilter === option ? 'default' : 'outline'}
                        onClick={() => setStatusFilter(option)}
                      >
                        {option === 'all'
                          ? 'All'
                          : option === 'complete'
                          ? 'Complete'
                          : 'Missing info'}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Showing {filteredRecords.length} of {enrichedRecords.length} records
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table className="w-full min-w-[960px]">
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Account Holder</TableHead>
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>IFSC Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[140px]">Last Updated</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center text-sm text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading bank records...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center text-sm text-muted-foreground">
                      No bank records match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {record.userId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.accountHolderName ?? 'Not provided'}
                      </TableCell>
                      <TableCell>{record.bankName ?? 'Not provided'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{formatAccountNumber(record)}</span>
                          {record.accountNumber && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              onClick={() => toggleRowVisibility(record.id)}
                            >
                              {revealedRows[record.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{record.ifscCode ?? 'Not provided'}</TableCell>
                      <TableCell>
                        {record.isComplete ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            Complete
                          </Badge>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                              Missing info
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {record.missingFields.join(', ')}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(record.lastUpdatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => navigate(RouteDict.Profile.EditBank(record.userId))}
                          disabled={!canEditAll}
                        >
                          <PenSquare className="h-4 w-4" />
                          Edit
                        </Button>
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
    </div>
  )
}

export default BankManagement
