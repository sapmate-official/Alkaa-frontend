import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Calendar, DollarSign, AlertCircle, TrendingUp, Play } from 'lucide-react'
import { PayrollCycle, PayrollStatistics, PayrollCycleProcessingStatusResponse } from '../../../types/payroll'
import { formatCurrency, formatDuration, getStatusBadgeVariant, getStatusIcon } from '../../utils/ui'

type ApprovedCycleSnapshot = {
  id: string
  month?: number | null
  year?: number | null
}

type MonthOption = {
  value: number
  label: string
}

type OverviewTabProps = {
  statistics: PayrollStatistics | null
  cycles: PayrollCycle[]
  cyclesNeedingReview: PayrollCycle[]
  months: MonthOption[]
  getProgressSnapshotForCycle: (cycleId: string) => PayrollCycleProcessingStatusResponse['progress'] | PayrollCycleProcessingStatusResponse['cycle']['processingSummary'] | null
  getProgressErrorForCycle: (cycleId: string) => string | null
  canDeleteCycle: (cycle: PayrollCycle | null) => boolean
  handleRequestDeleteCycle: (cycle: PayrollCycle) => void
  handleApproveCycle: (cycleSnapshot: ApprovedCycleSnapshot) => Promise<boolean>
  startPayrollCycle: (cycleId: string) => Promise<void>
  isProcessing: boolean
  isDeletingCycle: boolean
  cyclePendingDelete: PayrollCycle | null
}

const OverviewTab = ({
  statistics,
  cycles,
  cyclesNeedingReview,
  months,
  getProgressSnapshotForCycle,
  getProgressErrorForCycle,
  canDeleteCycle,
  handleRequestDeleteCycle,
  handleApproveCycle,
  startPayrollCycle,
  isProcessing,
  isDeletingCycle,
  cyclePendingDelete
}: OverviewTabProps) => {
  return (
    <div className="space-y-6">
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cycles</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalCycles}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.completedCycles} completed this year
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(statistics.totalAmountPaid)}</div>
              <p className="text-xs text-muted-foreground">
                To {statistics.totalEmployeesProcessed} employees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.pendingCycles}</div>
              <p className="text-xs text-muted-foreground">
                Cycles awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.totalCycles > 0
                  ? Math.round((statistics.completedCycles / statistics.totalCycles) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Successful completions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {cyclesNeedingReview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Cycles Needing Review ({cyclesNeedingReview.length})
            </CardTitle>
            <CardDescription>
              These payroll cycles have been processed and are waiting for approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cyclesNeedingReview.map((cycle) => (
                <div key={cycle.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium">
                        {months.find((m) => m.value === cycle.month)?.label} {cycle.year}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {cycle.processedCount} of {cycle.totalEmployees} employees processed
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(cycle.status)} className="flex items-center gap-1">
                      {getStatusIcon(cycle.status)}
                      {cycle.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">{formatCurrency(cycle.totalAmount)}</span>
                    {canDeleteCycle(cycle) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRequestDeleteCycle(cycle)}
                        disabled={isDeletingCycle && cyclePendingDelete?.id === cycle.id}
                      >
                        {isDeletingCycle && cyclePendingDelete?.id === cycle.id ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Deleting
                          </span>
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={() => handleApproveCycle({ id: cycle.id, month: cycle.month, year: cycle.year })}
                      disabled={isProcessing}
                      className="ml-4"
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Payroll Cycles</CardTitle>
          <CardDescription>
            Overview of recent payroll processing activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cycles.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No payroll cycles found. Create one to get started.
              </p>
            ) : (
              cycles.map((cycle) => {
                const monthLabel = months.find((m) => m.value === cycle.month)?.label ?? `Month ${cycle.month}`
                const progressSnapshot = getProgressSnapshotForCycle(cycle.id)
                const progressPercent =
                  progressSnapshot?.percentComplete ??
                  (cycle.totalEmployees > 0
                    ? Math.round((cycle.processedCount / cycle.totalEmployees) * 100)
                    : 0)
                const etaLabel = formatDuration(progressSnapshot?.etaMs ?? null)
                const statusMessage = progressSnapshot?.message
                const progressError = getProgressErrorForCycle(cycle.id)
                const processedCount = progressSnapshot?.processedCount ?? cycle.processedCount
                const totalEmployees = progressSnapshot?.totalEmployees ?? cycle.totalEmployees
                const failedCount = progressSnapshot?.failedCount ?? cycle.failedCount

                return (
                  <div
                    key={cycle.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex w-full flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-4">
                        <div>
                          <h4 className="font-medium">
                            {monthLabel} {cycle.year}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {processedCount} of {totalEmployees} employees
                            {failedCount > 0 && ` • ${failedCount} failed`}
                          </p>
                          {statusMessage && (
                            <p className="text-xs text-muted-foreground">{statusMessage}</p>
                          )}
                          {progressError && (
                            <p className="text-xs text-destructive">{progressError}</p>
                          )}
                        </div>
                        <Badge variant={getStatusBadgeVariant(cycle.status)} className="flex items-center gap-1">
                          {getStatusIcon(cycle.status)}
                          {cycle.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {cycle.status === 'IN_PROGRESS' && (
                        <div className="w-full max-w-md">
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{Math.min(progressPercent, 100)}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            ></div>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                            {etaLabel ? <span>ETA {etaLabel}</span> : <span>&nbsp;</span>}
                            <span>
                              {processedCount}/{totalEmployees}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(cycle.totalAmount)}</p>
                        {cycle.completedAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(cycle.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {canDeleteCycle(cycle) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRequestDeleteCycle(cycle)}
                          disabled={isDeletingCycle && cyclePendingDelete?.id === cycle.id}
                        >
                          {isDeletingCycle && cyclePendingDelete?.id === cycle.id ? (
                            <span className="flex items-center gap-1">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Deleting
                            </span>
                          ) : (
                            'Delete'
                          )}
                        </Button>
                      )}
                      {cycle.status === 'DRAFT' && (
                        <Button onClick={() => startPayrollCycle(cycle.id)} disabled={isProcessing} size="sm">
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OverviewTab
