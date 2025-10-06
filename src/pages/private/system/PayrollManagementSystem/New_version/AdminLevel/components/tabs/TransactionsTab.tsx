import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, DollarSign, BarChart3, Download, FileText } from 'lucide-react'
import { PayrollCycle, PayrollPayoutStatus } from '../../../types/payroll'
import { getStatusBadgeVariant, renderPayoutStatusBadge } from '../../utils/ui'

type MonthOption = {
  value: number
  label: string
}

type PayoutBuckets = {
  active: PayrollCycle[]
  failed: PayrollCycle[]
  completed: PayrollCycle[]
}

type TransactionsTabProps = {
  payoutBuckets: PayoutBuckets
  months: MonthOption[]
  onOpenPayoutFlow: (cycle: PayrollCycle, intent?: 'initiate' | 'continue') => void
  onViewSummary: (cycleId: string) => void
  onExportPayouts: () => void
  onBulkPaymentRecord: () => void
  onNavigateReporting: () => void
}

const TransactionsTab = ({
  payoutBuckets,
  months,
  onOpenPayoutFlow,
  onViewSummary,
  onExportPayouts,
  onBulkPaymentRecord,
  onNavigateReporting
}: TransactionsTabProps) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Ready for Payout
        </CardTitle>
        <CardDescription>
          Approved payroll cycles ready for transaction initiation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          We’re finishing up the payout tooling next. For now, you can approve cycles and use this
          workspace to review amounts, plan incentives, and coordinate disbursement with finance.
        </p>
        <p>
          Need to run the legacy flow? Head to the Salary Transactions page while we wire up the new
          experience here.
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payout Management
        </CardTitle>
        <CardDescription>
          Initiate and manage payroll payouts for approved cycles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {payoutBuckets.active.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active payout workflows</h3>
            <p className="text-muted-foreground mb-4">
              Complete and approve payroll cycles to enable payout management, or resume a cycle with pending payments.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payoutBuckets.active.map((cycle) => {
              const payoutStatus = (cycle.payoutStatus as PayrollPayoutStatus | undefined) ?? 'NOT_STARTED'
              const summary = cycle.payoutSummary
              const progress = summary?.progress
              const totals = summary?.totals
              const fallbackTotal = typeof summary?.totalRecords === 'number'
                ? summary.totalRecords
                : cycle.processedCount ?? cycle.totalEmployees ?? 0
              const totalRecords = progress?.totalRecords ?? fallbackTotal
              const completedRecords = progress?.completedRecords
                ?? ((totals?.COMPLETED ?? 0) + (totals?.NO_PAYOUT_REQUIRED ?? 0))
              const logicalRecords = progress?.logicalRecords ?? (totals?.NO_PAYOUT_REQUIRED ?? 0)
              const remainingRecords = progress?.remainingRecords
                ?? Math.max(0, totalRecords - completedRecords)
              const percentComplete = progress?.percentComplete
                ?? (totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0)
              const actionIntent: 'initiate' | 'continue' = ['NOT_STARTED', 'FAILED'].includes(payoutStatus)
                ? 'initiate'
                : 'continue'
              const actionLabel = actionIntent === 'initiate' ? 'Initiate Payout' : 'Continue Payout'
              const monthLabel = months.find((m) => m.value === cycle.month)?.label ?? cycle.month

              return (
                <div
                  key={cycle.id}
                  className="border rounded-lg p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-semibold">
                        {monthLabel} {cycle.year}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {percentComplete}% complete • {completedRecords} of {totalRecords} settled
                        {logicalRecords ? ` (${logicalRecords} logical)` : ''}
                        {remainingRecords > 0 ? ` • ${remainingRecords} remaining` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {renderPayoutStatusBadge(payoutStatus)}
                      <Badge variant={getStatusBadgeVariant(cycle.status)}>
                        {cycle.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    <Button variant="outline" size="sm" onClick={() => onViewSummary(cycle.id)}>
                      View Summary
                    </Button>
                    <Button size="sm" onClick={() => onOpenPayoutFlow(cycle, actionIntent)}>
                      {actionLabel}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {payoutBuckets.failed.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
              <AlertCircle className="h-4 w-4" />
              Attention needed
            </div>
            {payoutBuckets.failed.map((cycle) => {
              const monthLabel = months.find((m) => m.value === cycle.month)?.label ?? cycle.month
              return (
                <div
                  key={cycle.id}
                  className="border border-red-200 rounded-lg p-4 bg-red-50/50 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      {monthLabel} {cycle.year}
                    </p>
                    <p className="text-sm text-red-600">
                      Last payout attempt failed. Review discrepancies and try initiating again.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    <div className="flex flex-wrap gap-2">
                      {renderPayoutStatusBadge(cycle.payoutStatus)}
                      <Badge variant={getStatusBadgeVariant(cycle.status)}>{cycle.status}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => onViewSummary(cycle.id)}>
                        View Summary
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onOpenPayoutFlow(cycle, 'initiate')}>
                        Retry Payout
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {payoutBuckets.completed.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Completed payouts
            </div>
            {payoutBuckets.completed.map((cycle) => {
              const summary = cycle.payoutSummary
              const progress = summary?.progress
              const totalRecords = progress?.totalRecords
                ?? (typeof summary?.totalRecords === 'number' ? summary.totalRecords : cycle.processedCount ?? 0)
              const completedRecords = progress?.completedRecords ?? totalRecords
              const logicalRecords = progress?.logicalRecords ?? 0
              const monthLabel = months.find((m) => m.value === cycle.month)?.label ?? cycle.month
              const completedAt = cycle.payoutCompletedAt
                ? new Date(cycle.payoutCompletedAt).toLocaleString()
                : 'Recently'

              return (
                <div
                  key={cycle.id}
                  className="border rounded-lg p-4 bg-green-50/60 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-green-700">
                      {monthLabel} {cycle.year}
                    </h4>
                    <p className="text-sm text-green-700">
                      {completedRecords} of {totalRecords} settled{logicalRecords ? ` (${logicalRecords} logical)` : ''}. Payout finalized on {completedAt}.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {renderPayoutStatusBadge(cycle.payoutStatus)}
                      <Badge variant={getStatusBadgeVariant(cycle.status)}>{cycle.status}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onViewSummary(cycle.id)}>
                    View Summary
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" onClick={onExportPayouts} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Payouts
            </Button>
            <Button variant="outline" onClick={onBulkPaymentRecord} className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Bulk Payment Record
            </Button>
            <Button variant="outline" onClick={onNavigateReporting} className="w-full">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

export default TransactionsTab
