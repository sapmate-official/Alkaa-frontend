import { useState } from 'react'
import { StepProps } from '../../PayrollPipelinePage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, AlertCircle, Play, Loader2, XCircle } from 'lucide-react'

const ProcessingStep = ({ cycleData, onDataChange, onNext }: StepProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(cycleData.processingProgress || 0)
  
  const totalEmployees = cycleData.cycle?.totalEmployees || 0
  const processedCount = Math.floor((progress / 100) * totalEmployees)
  const failedCount = cycleData.failedCount || 0
  const hasProcessed = cycleData.allProcessed

  const handleStartProcessing = async () => {
    setIsProcessing(true)
    
    // Simulate processing with progress updates
    for (let i = progress; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300))
      setProgress(i)
      onDataChange((prev) => ({
        ...prev,
        processingStarted: true,
        processingProgress: i,
        processedCount: Math.floor((i / 100) * totalEmployees)
      }))
    }
    
    setIsProcessing(false)
    onDataChange((prev) => ({
      ...prev,
      allProcessed: true,
      processingProgress: 100,
      processedCount: totalEmployees,
      failedCount: 0
    }))
  }

  const handleSubmitForReview = () => {
    onNext()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Salary Processing
          </CardTitle>
          <CardDescription>
            Generate and validate salary calculations for all employees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!cycleData.processingStarted ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Click the button below to start processing salaries for all employees in this cycle.
                  This will apply salary templates, calculate allowances, deductions, and generate final amounts.
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Employees</p>
                    <p className="text-2xl font-bold">{totalEmployees}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant="outline">Ready to Process</Badge>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleStartProcessing} 
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Salary Processing
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Processing Progress</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs mb-1">Total</p>
                        <p className="text-2xl font-bold">{totalEmployees}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-green-700 text-xs mb-1">Processed</p>
                        <p className="text-2xl font-bold text-green-900">{processedCount}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-red-700 text-xs mb-1">Failed</p>
                        <p className="text-2xl font-bold text-red-900">{failedCount}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {isProcessing && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Processing salary calculations... Please wait while we calculate salaries for all employees.
                    </AlertDescription>
                  </Alert>
                )}

                {hasProcessed && !isProcessing && (
                  <>
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-900">
                        <strong>Processing Complete!</strong> All employee salaries have been calculated successfully.
                        You can now proceed to review and approval.
                      </AlertDescription>
                    </Alert>

                    <Button 
                      onClick={handleSubmitForReview}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit for Review & Approval
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {cycleData.processingStarted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Processing Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Template Applied:</span>
                <span>{cycleData.cycle?.templateName || 'Default Template'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Calculation Method:</span>
                <span>Automated</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ProcessingStep
