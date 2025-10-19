import { useState, useEffect, useCallback, useRef } from 'react'
import { StepProps } from '../../PayrollPipelinePage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, AlertCircle, Play, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import axios from 'axios'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import { tokenStorage } from '@/providers/AuthContext'

const ProcessingStep = ({ cycleData, onDataChange, onNext }: StepProps) => {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const cycleId = cycleData.cycle?.id
  const totalEmployees = cycleData.cycle?.totalEmployees || 0
  const cycleStatus = cycleData.cycle?.status
  const eventSourceRef = useRef<EventSource | null>(null)
  const [isStreamActive, setIsStreamActive] = useState(false)
  const [statusCounts, setStatusCounts] = useState({
    processed: cycleData.processedCount || 0,
    failed: cycleData.failedCount || 0,
    total: totalEmployees
  })

  // Get current counts from cycleData
  const processedCount = statusCounts.processed
  const failedCount = statusCounts.failed
  const trackedTotalEmployees = statusCounts.total || totalEmployees
  const hasProcessed = cycleData.allProcessed
  
  // Calculate progress from processed count
  const calculatedProgress = trackedTotalEmployees > 0 ? Math.round((processedCount / trackedTotalEmployees) * 100) : 0
  
  // Show processing if status is IN_PROGRESS or if we have progress
  const isActivelyProcessing = isProcessing || cycleStatus === 'IN_PROGRESS' || (progress > 0 && progress < 100)
  const shouldShowProgressView = cycleData.processingStarted || isActivelyProcessing || progress > 0
  
  // Update progress state when cycleData changes
  useEffect(() => {
    if (cycleData.processingProgress !== undefined) {
      setProgress(cycleData.processingProgress)
    } else if (calculatedProgress !== progress) {
      setProgress(calculatedProgress)
    }
  }, [cycleData.processingProgress, calculatedProgress, progress])

  useEffect(() => {
    setStatusCounts({
      processed: cycleData.processedCount || 0,
      failed: cycleData.failedCount || 0,
      total: cycleData.cycle?.totalEmployees || totalEmployees
    })
  }, [cycleData.processedCount, cycleData.failedCount, cycleData.cycle?.totalEmployees, totalEmployees])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  // Poll for processing status
  const handleStatusUpdate = useCallback((status: any) => {
    if (!status) return

    const cycleStats = status.cycle ?? status
    const processedFromStatus = cycleStats?.processedCount ?? status.processedCount ?? 0
    const failedFromStatus = cycleStats?.failedCount ?? status.failedCount ?? 0
  const totalFromStatus = cycleStats?.totalEmployees ?? status.totalEmployees ?? (statusCounts.total || totalEmployees)
    const percentComplete = typeof status.percentComplete === 'number'
      ? status.percentComplete
      : (totalFromStatus > 0 ? Math.round((processedFromStatus / totalFromStatus) * 100) : 0)
    const jobStatus = status.job?.status
    const cycleStage = cycleStats?.status
    const isComplete = cycleStage === 'COMPLETED' || percentComplete >= 100
    const isProcessingStatus = !isComplete && (jobStatus === 'PROCESSING' || cycleStage === 'IN_PROGRESS' || processedFromStatus < totalFromStatus)

    setProgress(percentComplete)
    setIsProcessing(isProcessingStatus)
    setStatusCounts({
      processed: processedFromStatus,
      failed: failedFromStatus,
      total: totalFromStatus
    })

    onDataChange((prev) => ({
      ...prev,
      cycle: prev.cycle ? { ...prev.cycle, status: cycleStage ?? prev.cycle.status, totalEmployees: totalFromStatus } : prev.cycle,
      processingStarted: true,
      processingProgress: percentComplete,
      processedCount: processedFromStatus,
      failedCount: failedFromStatus,
      allProcessed: isComplete && failedFromStatus === 0
    }), { markDirty: false })

    if (isComplete) {
      stopPolling()
    }
  }, [onDataChange, statusCounts.total, totalEmployees, stopPolling])

  const checkProcessingStatus = useCallback(async () => {
    if (!cycleId) return

    try {
      const response = await axios.get(
        APIV3Dictionary.payroll.getCycleProcessingStatus(cycleId),
        { withCredentials: true }
      )

      if (response.data.success && response.data.data) {
        handleStatusUpdate(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch processing status:', error)
    }
  }, [cycleId, handleStatusUpdate])

  const startPolling = useCallback((intervalMs: number) => {
    stopPolling()
    pollingRef.current = setInterval(() => {
      checkProcessingStatus()
    }, intervalMs)
  }, [checkProcessingStatus, stopPolling])

  // Start polling when processing begins
  useEffect(() => {
    const shouldPoll = (isProcessing || cycleStatus === 'IN_PROGRESS') && !isStreamActive

    if (shouldPoll) {
      checkProcessingStatus()
      startPolling(document.hidden ? 6000 : 2000)
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [isProcessing, cycleStatus, isStreamActive, checkProcessingStatus, startPolling, stopPolling])

  // Check initial status on mount
  useEffect(() => {
    if (cycleId) {
      checkProcessingStatus()
    }
  }, [cycleId, checkProcessingStatus])

  // Stream updates via SSE when available
  useEffect(() => {
    if (!cycleId || typeof window === 'undefined' || typeof EventSource === 'undefined') {
      setIsStreamActive(false)
      return
    }

    const accessToken = tokenStorage.getAccessToken()
    if (!accessToken) {
      setIsStreamActive(false)
      return
    }

    let streamUrl = APIV3Dictionary.payroll.getCycleProcessingStream(cycleId)
    try {
      const url = new URL(streamUrl)
      url.searchParams.set('token', accessToken)
      streamUrl = url.toString()
    } catch (urlError) {
      console.error('Failed to prepare progress stream URL:', urlError)
      setIsStreamActive(false)
      return
    }

    try {
      const eventSource = new EventSource(streamUrl)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsStreamActive(true)
        stopPolling()
      }

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          handleStatusUpdate(payload)
        } catch (parseError) {
          console.error('Failed to parse progress stream payload:', parseError)
        }
      }

      eventSource.onerror = (event) => {
        console.error('Progress stream encountered an error:', event)
        eventSource.close()
        eventSourceRef.current = null
        setIsStreamActive(false)
      }

      return () => {
        eventSource.close()
        eventSourceRef.current = null
        setIsStreamActive(false)
      }
    } catch (streamError) {
      console.error('Failed to establish progress stream:', streamError)
      setIsStreamActive(false)
    }
  }, [cycleId, handleStatusUpdate, stopPolling])

  // Adjust polling frequency when tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const shouldPoll = (isProcessing || cycleStatus === 'IN_PROGRESS') && !isStreamActive
      if (!shouldPoll) {
        stopPolling()
        return
      }

      if (document.hidden) {
        startPolling(6000)
      } else {
        checkProcessingStatus()
        startPolling(2000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isProcessing, cycleStatus, isStreamActive, startPolling, stopPolling, checkProcessingStatus])

  const handleStartProcessing = async () => {
    if (!cycleId) {
      toast({
        title: 'Error',
        description: 'No cycle ID found',
        variant: 'destructive'
      })
      return
    }

    setIsProcessing(true)
    
    try {
      const response = await axios.post(
        APIV3Dictionary.payroll.startCycle(cycleId),
        {},
        { withCredentials: true }
      )

      if (response.data.success) {
        toast({
          title: 'Processing Started',
          description: 'Salary processing has been queued and will begin shortly',
        })
        
        // Start polling for status
        checkProcessingStatus()
      } else {
        toast({
          title: 'Error',
          description: response.data.message || 'Failed to start processing',
          variant: 'destructive'
        })
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Failed to start processing:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start salary processing',
        variant: 'destructive'
      })
      setIsProcessing(false)
    }
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
          {!shouldShowProgressView ? (
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
                    <p className="text-2xl font-bold">{trackedTotalEmployees}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant="outline">Ready to Process</Badge>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleStartProcessing} 
                disabled={isProcessing || !cycleId}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing Progress</span>
                    <span className="text-sm font-semibold">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{processedCount} of {trackedTotalEmployees} employees processed</span>
                    {isActivelyProcessing && progress < 100 && (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Processing...
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs mb-1">Total</p>
                        <p className="text-2xl font-bold">{trackedTotalEmployees}</p>
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

                {isActivelyProcessing && progress < 100 && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Processing salary calculations in background... {processedCount} of {trackedTotalEmployees} employees completed.
                      {failedCount > 0 && ` ${failedCount} failed.`}
                    </AlertDescription>
                  </Alert>
                )}

                {hasProcessed && !isActivelyProcessing && (
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
