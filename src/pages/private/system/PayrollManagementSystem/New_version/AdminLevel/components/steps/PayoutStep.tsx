import { useState } from 'react'
import { StepProps } from '../../PayrollPipelinePage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign, 
  CheckCircle, 
  Loader2, 
  Send, 
  FileText, 
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PartyPopper
} from 'lucide-react'

const PayoutStep = ({ cycleData, onDataChange, onComplete }: StepProps) => {
  const [payoutStatus, setPayoutStatus] = useState<'ready' | 'processing' | 'completed'>(
    cycleData.payoutComplete ? 'completed' : 'ready'
  )
  const [progress, setProgress] = useState(0)

  const totalEmployees = cycleData.cycle?.totalEmployees || 0
  const processedCount = cycleData.processedCount || totalEmployees
  const totalAmount = processedCount * 45000 // Simulated

  const handleInitiatePayout = async () => {
    setPayoutStatus('processing')
    
    // Simulate payout processing
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, 400))
      setProgress(i)
    }
    
    setPayoutStatus('completed')
    onDataChange((prev) => ({
      ...prev,
      payoutInitiated: true,
      payoutComplete: true,
      payoutInitiatedAt: new Date().toISOString(),
      payoutStatus: 'COMPLETED',
      payoutProgress: 100
    }))
    
    // Mark entire pipeline as complete
    if (onComplete) {
      onComplete()
    }
  }

  const hasCompleted = cycleData.payoutComplete

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Payout step - Will integrate with TransactionsTab component
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Transactions & Payout
          </CardTitle>
          <CardDescription>
            Initiate bank transfers and distribute payslips
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {payoutStatus === 'ready' && !hasCompleted && (
            <>
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">Ready for Payout</AlertTitle>
                <AlertDescription className="text-green-800">
                  The payroll cycle has been approved and is ready for payout processing. 
                  Click below to initiate bank transfers.
                </AlertDescription>
              </Alert>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-blue-900">Payout Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Total Employees</p>
                        <p className="text-2xl font-bold text-blue-900">{processedCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-blue-900">
                          ₹ {totalAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Payment Method</p>
                        <Badge className="bg-blue-600">Bank Transfer</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Status</p>
                        <Badge className="bg-green-600">Ready</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Payout Actions:</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Payslips
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export Transaction File
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Reports
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={handleInitiatePayout}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                Initiate Bank Transfers
              </Button>
            </>
          )}

          {payoutStatus === 'processing' && (
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                <AlertTitle className="text-blue-900">Processing Payouts...</AlertTitle>
                <AlertDescription className="text-blue-800">
                  Initiating bank transfers for {processedCount} employees. This may take a few moments.
                </AlertDescription>
              </Alert>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Transfer Progress</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Processing payments... Please do not close this window
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {(payoutStatus === 'completed' || hasCompleted) && (
            <>
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <Sparkles className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  Payroll Complete! 🎉
                </h3>
                <p className="text-muted-foreground mb-4">
                  All payouts have been initiated successfully
                </p>
              </div>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Payout Status</span>
                      <Badge className="bg-green-600">Completed</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Employees Paid</span>
                      <span className="font-semibold text-green-900">{processedCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Total Disbursed</span>
                      <span className="font-semibold text-green-900">
                        ₹ {totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Initiated At</span>
                      <span className="text-sm text-green-900">
                        {cycleData.payoutInitiatedAt 
                          ? new Date(cycleData.payoutInitiatedAt).toLocaleString()
                          : 'Just now'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Post-Payout Actions:</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        View Payslips
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Download Reports
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        View Transaction History
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert className="bg-green-50 border-green-200">
                <PartyPopper className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Payroll cycle completed successfully!</strong> All payments have been processed and payslips distributed.
                  You can access this cycle's details in the History section.
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PayoutStep
