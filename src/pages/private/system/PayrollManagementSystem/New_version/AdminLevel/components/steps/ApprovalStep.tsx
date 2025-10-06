import { useState } from 'react'
import { StepProps } from '../../PayrollPipelinePage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, AlertTriangle, Lock, CheckCircle, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react'

const ApprovalStep = ({ cycleData, onDataChange, onNext }: StepProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  const totalEmployees = cycleData.cycle?.totalEmployees || 0
  const processedCount = cycleData.processedCount || totalEmployees
  const approvedCount = cycleData.approvedCount || processedCount
  const hasApproved = cycleData.approved

  const totalAmount = processedCount * 45000 // Simulated total

  const handleApproveClick = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmApproval = async () => {
    setIsApproving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    onDataChange((prev) => ({
      ...prev,
      approved: true,
      approvalDate: new Date(),
      approvedAt: new Date().toISOString(),
      cycleStatus: 'APPROVED',
      locked: true
    }))
    
    setIsApproving(false)
    setShowConfirmDialog(false)
  }

  const handleProceedToPayout = () => {
    onNext()
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Final approval step - Will integrate with cycle approval functionality
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Final Approval
          </CardTitle>
          <CardDescription>
            Lock and approve the payroll cycle for payout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasApproved ? (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important: Final Approval</AlertTitle>
                <AlertDescription>
                  Once approved, this cycle will be locked and salary records cannot be modified. 
                  Make sure all reviews are complete before proceeding.
                </AlertDescription>
              </Alert>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-blue-900">Approval Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Cycle Period</p>
                        <p className="font-semibold text-blue-900">
                          {cycleData.cycle?.month && cycleData.cycle?.year
                            ? `${new Date(cycleData.cycle.year, cycleData.cycle.month - 1).toLocaleDateString('en-US', { month: 'long' })} ${cycleData.cycle.year}`
                            : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Status</p>
                        <Badge className="bg-blue-600">Ready for Approval</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Total Employees</p>
                        <p className="font-semibold text-blue-900">{processedCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Reviewed Records</p>
                        <p className="font-semibold text-blue-900">{approvedCount}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-blue-700 mb-1">Total Payout Amount</p>
                        <p className="text-2xl font-bold text-blue-900">
                          ₹ {totalAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Pre-Approval Checklist:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>All employees processed successfully</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Salary calculations reviewed and verified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>No pending disputes or corrections</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Compliance requirements met</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={handleApproveClick} 
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Approve & Lock Payroll Cycle
              </Button>
            </>
          ) : (
            <>
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">Cycle Approved!</AlertTitle>
                <AlertDescription className="text-green-800">
                  This payroll cycle has been approved and locked. You can now proceed to initiate payouts.
                </AlertDescription>
              </Alert>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Approval Status</span>
                      <Badge className="bg-green-600">Approved</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Cycle Status</span>
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-green-700" />
                        <span className="text-sm font-medium text-green-900">Locked</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Approved At</span>
                      <span className="text-sm font-medium text-green-900">
                        {cycleData.approvedAt ? new Date(cycleData.approvedAt).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-green-300 pt-3 mt-3">
                      <span className="text-base font-semibold text-green-900">Total Amount</span>
                      <span className="text-xl font-bold text-green-900">
                        ₹ {totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={handleProceedToPayout}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Proceed to Payout & Transactions
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Confirm Final Approval
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to approve and lock this payroll cycle for <strong>{processedCount} employees</strong> with 
                a total payout of <strong>₹ {totalAmount.toLocaleString('en-IN')}</strong>.
              </p>
              <p className="text-red-600 font-medium">
                ⚠️ This action cannot be undone. Once approved, salary records cannot be modified.
              </p>
              <p>
                Are you sure all calculations have been reviewed and verified?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmApproval}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? 'Approving...' : 'Yes, Approve & Lock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ApprovalStep
