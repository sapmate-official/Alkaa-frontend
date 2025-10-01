import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Loader2 } from 'lucide-react'
import { PayrollCycle } from '../../../types/payroll'
import { getStatusBadgeVariant } from '../../utils/ui'

type MonthOption = {
  value: number
  label: string
}

type ReviewApprovalTabProps = {
  cyclesNeedingReview: PayrollCycle[]
  months: MonthOption[]
  onApproveCycle: (cycleSnapshot: { id: string; month?: number | null; year?: number | null }) => Promise<boolean>
  onOpenReviewDetails: (cycleId: string) => void
  isProcessing: boolean
  reviewLoadingCycleId: string | null
}

const ReviewApprovalTab = ({
  cyclesNeedingReview,
  months,
  onApproveCycle,
  onOpenReviewDetails,
  isProcessing,
  reviewLoadingCycleId
}: ReviewApprovalTabProps) => (
  <TabsContent value="review-approval" className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Bulk Review & Approval
        </CardTitle>
        <CardDescription>
          Review and approve payroll calculations with comments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {cyclesNeedingReview.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No cycles pending review</p>
            <p className="text-sm">Cycles will appear here when they need approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cyclesNeedingReview.map((cycle) => (
              <div key={cycle.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium">
                      {months.find((m) => m.value === cycle.month)?.label} {cycle.year}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {cycle.processedCount} employees processed
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(cycle.status)}>
                    {cycle.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onApproveCycle({ id: cycle.id, month: cycle.month, year: cycle.year })}
                    disabled={isProcessing}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenReviewDetails(cycle.id)}
                    disabled={reviewLoadingCycleId === cycle.id}
                  >
                    {reviewLoadingCycleId === cycle.id ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading
                      </span>
                    ) : (
                      'Review Details'
                    )}
                  </Button>
                  <Button size="sm" variant="destructive" disabled={isProcessing}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  </TabsContent>
)

export default ReviewApprovalTab
