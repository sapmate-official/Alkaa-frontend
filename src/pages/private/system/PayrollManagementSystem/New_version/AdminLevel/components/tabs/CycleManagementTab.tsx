import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import { MonthAndYearSelector } from '../../../ui/MonthYearPicker'
import { PayrollCycle, PayrollCycleProcessingStatusResponse } from '../../../types/payroll'
import { formatDuration } from '../../utils/ui'

type MonthOption = {
  value: number
  label: string
}

type CycleManagementTabProps = {
  months: MonthOption[]
  years: number[]
  selectedMonth: number
  selectedYear: number
  onMonthChange: (value: number) => void
  onYearChange: (value: number) => void
  onCreateCycle: () => void
  isCreatingCycle: boolean
  activeProcessingJobs: PayrollCycle[]
  getProgressSnapshotForCycle: (cycleId: string) => PayrollCycleProcessingStatusResponse['progress'] | PayrollCycleProcessingStatusResponse['cycle']['processingSummary'] | null
  getProgressErrorForCycle: (cycleId: string) => string | null
  cycleProgressMap: Record<string, PayrollCycleProcessingStatusResponse | undefined>
}

const CycleManagementTab = ({
  months,
  years,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onCreateCycle,
  isCreatingCycle,
  activeProcessingJobs,
  getProgressSnapshotForCycle,
  getProgressErrorForCycle,
  cycleProgressMap
}: CycleManagementTabProps) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Create New Payroll Cycle</CardTitle>
        <CardDescription>
          Start a new monthly payroll cycle for bulk salary generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <MonthAndYearSelector
          months={months}
          years={years}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          setSelectedMonth={onMonthChange}
          setSelectedYear={onYearChange}
        />
        <Button onClick={onCreateCycle} disabled={isCreatingCycle} className="w-full">
          {isCreatingCycle ? 'Creating...' : 'Create Payroll Cycle'}
        </Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Processing Queue
        </CardTitle>
        <CardDescription>
          Background job queue for payroll calculations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activeProcessingJobs.length ? (
          <div className="space-y-3">
            {activeProcessingJobs.map((cycle) => {
              const monthLabel = months.find((m) => m.value === cycle.month)?.label ?? `Month ${cycle.month}`
              const progressSnapshot = getProgressSnapshotForCycle(cycle.id)
              const progressPercent =
                progressSnapshot?.percentComplete ??
                (cycle.totalEmployees > 0
                  ? Math.round((cycle.processedCount / cycle.totalEmployees) * 100)
                  : 0)
              const processedCount = progressSnapshot?.processedCount ?? cycle.processedCount
              const totalEmployees = progressSnapshot?.totalEmployees ?? cycle.totalEmployees
              const jobStatus = cycleProgressMap[cycle.id]?.job?.status ?? 'PENDING'
              const etaLabel = formatDuration(progressSnapshot?.etaMs ?? null)
              const statusMessage = progressSnapshot?.message
              const progressError = getProgressErrorForCycle(cycle.id)
              const jobUpdatedAt = cycleProgressMap[cycle.id]?.job?.updatedAt ?? null

              return (
                <div key={cycle.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="font-medium">
                        {monthLabel} {cycle.year}
                      </h4>
                      <p className="text-xs text-muted-foreground capitalize">
                        Job status: {jobStatus.toLowerCase()}
                        {jobUpdatedAt && ` • updated ${new Date(jobUpdatedAt).toLocaleTimeString()}`}
                      </p>
                      {statusMessage && <p className="text-xs text-muted-foreground">{statusMessage}</p>}
                      {progressError && <p className="text-xs text-destructive">{progressError}</p>}
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {jobStatus.toLowerCase()}
                    </Badge>
                  </div>
                  <div className="mt-3">
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
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active processing jobs</p>
            <p className="text-sm">Jobs will appear here when payroll calculations are running</p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
)

export default CycleManagementTab
