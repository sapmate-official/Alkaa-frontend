import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Play } from 'lucide-react'
import { PayrollCycle, PayrollCycleProcessingStatusResponse } from '../../../types/payroll'
import { formatCurrency, formatDuration, getStatusBadgeVariant } from '../../utils/ui'

type MonthOption = {
  value: number
  label: string
}

type ProcessingTabProps = {
  processingCycles: PayrollCycle[]
  months: MonthOption[]
  getProgressSnapshotForCycle: (cycleId: string) => PayrollCycleProcessingStatusResponse['progress'] | PayrollCycleProcessingStatusResponse['cycle']['processingSummary'] | null
  getProgressErrorForCycle: (cycleId: string) => string | null
  onOpenProcessingDrawer: (cycle: PayrollCycle) => void
  onStartPayrollCycle: (cycleId: string) => Promise<void>
  isProcessing: boolean
}

const ProcessingTab = ({
  processingCycles,
  months,
  getProgressSnapshotForCycle,
  getProgressErrorForCycle,
  onOpenProcessingDrawer,
  onStartPayrollCycle,
  isProcessing
}: ProcessingTabProps) => (
  <TabsContent value="processing" className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Processing Workspace
        </CardTitle>
        <CardDescription>
          Inspect salary breakdowns, adjust templates, and validate attendance before moving a cycle to review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Choose a cycle below to open the employee-by-employee processing panel. From there you can drill into salary
          components, compare templates, and capture attendance corrections prior to approval.
        </p>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>What you can manage here</AlertTitle>
          <AlertDescription>
            <ul className="ml-5 list-disc space-y-1 text-xs leading-relaxed text-muted-foreground">
              <li>Review salary breakdowns with allowances, deductions, and adjustments for each employee.</li>
              <li>Preview attendance timelines to spot missing punches or leave discrepancies.</li>
              <li>Queue up template changes or regeneration requests before handing off for approval.</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Cycles ready for processing</CardTitle>
        <CardDescription>
          Draft and in-progress cycles that still need validation before review and approval.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {processingCycles.length ? (
          <div className="space-y-3">
            {processingCycles.map((cycle) => {
              const monthLabel = months.find((m) => m.value === cycle.month)?.label ?? `Month ${cycle.month}`
              const progressSnapshot = getProgressSnapshotForCycle(cycle.id)
              const progressPercent =
                progressSnapshot?.percentComplete ??
                (cycle.totalEmployees > 0
                  ? Math.round((cycle.processedCount / cycle.totalEmployees) * 100)
                  : 0)
              const processedCount = progressSnapshot?.processedCount ?? cycle.processedCount
              const totalEmployees = progressSnapshot?.totalEmployees ?? cycle.totalEmployees
              const failedCount = progressSnapshot?.failedCount ?? cycle.failedCount
              const etaLabel = formatDuration(progressSnapshot?.etaMs ?? null)
              const statusMessage = progressSnapshot?.message
              const progressError = getProgressErrorForCycle(cycle.id)

              return (
                <div
                  key={cycle.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold">
                        {monthLabel} {cycle.year}
                      </h4>
                      <Badge variant={getStatusBadgeVariant(cycle.status)}>
                        {cycle.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {processedCount} of {totalEmployees} employees processed
                      {failedCount > 0 ? ` • ${failedCount} failed` : ''}
                    </p>
                    {statusMessage && <p className="text-xs text-muted-foreground">{statusMessage}</p>}
                    {progressError && <p className="text-xs text-destructive">{progressError}</p>}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Total amount {formatCurrency(cycle.totalAmount)}</span>
                      <span>Progress {Math.min(progressPercent, 100)}%</span>
                      {etaLabel && <span>ETA {etaLabel}</span>}
                    </div>
                    <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch gap-2 md:items-end">
                    <Button variant="outline" size="sm" onClick={() => onOpenProcessingDrawer(cycle)}>
                      Open processing workspace
                    </Button>
                    {cycle.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onStartPayrollCycle(cycle.id)}
                        disabled={isProcessing}
                      >
                        Start cycle
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-10 text-center text-muted-foreground">
            All caught up! Begin a new cycle or resume an in-progress run to continue processing salaries.
          </div>
        )}
      </CardContent>
    </Card>
  </TabsContent>
)

export default ProcessingTab
