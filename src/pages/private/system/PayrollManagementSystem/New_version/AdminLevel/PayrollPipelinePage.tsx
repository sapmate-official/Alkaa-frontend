import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import PipelineVisualization from './components/PipelineVisualization'
import CreateCycleStep from './components/steps/CreateCycleStep'
import SetupStep from './components/steps/SetupStep'
import ProcessingStep from './components/steps/ProcessingStep'
import ReviewStep from './components/steps/ReviewStep'
import ApprovalStep from './components/steps/ApprovalStep'
import PayoutStep from './components/steps/PayoutStep'
import {
  getPipelineProgress,
  savePipelineProgress,
  clearPipelineProgress,
  type PipelineProgressData,
} from './services/pipelineApi'

export type StepStatus = 'not_started' | 'in_progress' | 'completed' | 'failed' | 'skipped'

export interface PipelineStepDefinition {
  id: number
  name: string
  shortName: string
  description: string
  status: StepStatus
  component: React.ComponentType<StepProps>
  canProgress: (data: CycleData) => boolean
  canSkip?: boolean
  icon?: React.ReactNode
}

export interface CycleData {
  cycle?: any | null
  cycleId?: string | null
  month?: number
  year?: number
  template?: any | null
  setupComplete?: boolean
  employeesVerified?: boolean
  attendanceImported?: boolean
  processingStarted?: boolean
  allProcessed?: boolean
  processingProgress?: number
  failedCount?: number
  reviewStarted?: boolean
  allReviewed?: boolean
  pendingReviewCount?: number
  approved?: boolean
  approvalDate?: Date | null
  payoutInitiated?: boolean
  payoutComplete?: boolean
  transactions?: any[]
  [key: string]: any
}

export interface StepProps {
  cycleData: CycleData
  onDataChange: (data: CycleData | ((prev: CycleData) => CycleData)) => void
  onNext: () => void
  onBack: () => void
  onComplete: () => void
  isActive: boolean
}

const INITIAL_CYCLE_DATA: CycleData = {
  cycle: null,
  cycleId: null,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  template: null,
  setupComplete: false,
  employeesVerified: false,
  attendanceImported: false,
  processingStarted: false,
  allProcessed: false,
  processingProgress: 0,
  failedCount: 0,
  reviewStarted: false,
  allReviewed: false,
  pendingReviewCount: 0,
  approved: false,
  approvalDate: null,
  payoutInitiated: false,
  payoutComplete: false,
  transactions: []
}

const PIPELINE_STEPS: PipelineStepDefinition[] = [
  {
    id: 1,
    name: 'Create Cycle',
    shortName: 'Create',
    description: 'Create a new payroll cycle and select employees',
    status: 'not_started',
    component: CreateCycleStep,
    canProgress: (data) => Boolean(data.cycle && data.cycleId)
  },
  {
    id: 2,
    name: 'Setup & Configuration',
    shortName: 'Setup',
    description: 'Verify employee data, configure components, and import attendance',
    status: 'not_started',
    component: SetupStep,
    canProgress: (data) => Boolean(data.setupComplete && data.employeesVerified)
  },
  {
    id: 3,
    name: 'Process Salaries',
    shortName: 'Process',
    description: 'Generate salary calculations for all employees',
    status: 'not_started',
    component: ProcessingStep,
    canProgress: (data) => Boolean(data.allProcessed && data.failedCount === 0)
  },
  {
    id: 4,
    name: 'Review & Approval',
    shortName: 'Review',
    description: 'Review individual salary records and approve',
    status: 'not_started',
    component: ReviewStep,
    canProgress: (data) => Boolean(data.allReviewed && data.pendingReviewCount === 0)
  },
  {
    id: 5,
    name: 'Final Approval',
    shortName: 'Approve',
    description: 'Lock cycle and give final approval for payout',
    status: 'not_started',
    component: ApprovalStep,
    canProgress: (data) => Boolean(data.approved && data.approvalDate)
  },
  {
    id: 6,
    name: 'Transactions & Payout',
    shortName: 'Payout',
    description: 'Process payments and distribute payslips',
    status: 'not_started',
    component: PayoutStep,
    canProgress: () => true // Final step, always can finish
  }
]

const getStepStatusVariant = (status: StepStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'completed':
      return 'default'
    case 'in_progress':
      return 'default'
    case 'failed':
      return 'destructive'
    case 'skipped':
      return 'secondary'
    default:
      return 'outline'
  }
}

const getStepStatusLabel = (status: StepStatus): string => {
  switch (status) {
    case 'not_started':
      return 'Not Started'
    case 'in_progress':
      return 'In Progress'
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'skipped':
      return 'Skipped'
    default:
      return 'Unknown'
  }
}

const PayrollPipelinePage = () => {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [cycleData, setCycleData] = useState<CycleData>(INITIAL_CYCLE_DATA)
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStepDefinition[]>(PIPELINE_STEPS)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)
  const [isSavingProgress, setIsSavingProgress] = useState(false)
  const [hasSavedProgress, setHasSavedProgress] = useState(false)

  // Update step status based on cycle data
  useEffect(() => {
    setPipelineSteps((prev) => {
      const updated = [...prev]
      
      // Step 1: Create Cycle
      if (cycleData.cycle && cycleData.cycleId) {
        updated[0].status = 'completed'
      } else if (currentStep === 1) {
        updated[0].status = 'in_progress'
      }

      // Step 2: Setup
      if (cycleData.setupComplete) {
        updated[1].status = 'completed'
      } else if (currentStep === 2 && updated[0].status === 'completed') {
        updated[1].status = 'in_progress'
      }

      // Step 3: Processing
      if (cycleData.allProcessed) {
        updated[2].status = (cycleData.failedCount ?? 0) > 0 ? 'failed' : 'completed'
      } else if (currentStep === 3 && updated[1].status === 'completed') {
        updated[2].status = 'in_progress'
      }

      // Step 4: Review
      if (cycleData.allReviewed) {
        updated[3].status = 'completed'
      } else if (currentStep === 4 && updated[2].status === 'completed') {
        updated[3].status = 'in_progress'
      }

      // Step 5: Approval
      if (cycleData.approved) {
        updated[4].status = 'completed'
      } else if (currentStep === 5 && updated[3].status === 'completed') {
        updated[4].status = 'in_progress'
      }

      // Step 6: Payout
      if (cycleData.payoutComplete) {
        updated[5].status = 'completed'
      } else if (currentStep === 6 && updated[4].status === 'completed') {
        updated[5].status = 'in_progress'
      }

      return updated
    })
  }, [cycleData, currentStep])

  const activeStep = pipelineSteps[currentStep - 1]
  const ActiveStepComponent = activeStep.component

  const canGoNext = useCallback(() => {
    return activeStep.canProgress(cycleData) && currentStep < pipelineSteps.length
  }, [activeStep, cycleData, currentStep, pipelineSteps.length])

  const canGoBack = useCallback(() => {
    return currentStep > 1
  }, [currentStep])

  const handleNext = useCallback(() => {
    if (canGoNext()) {
      setCurrentStep((prev) => prev + 1)
      setHasUnsavedChanges(false)
    }
  }, [canGoNext])

  const handleBack = useCallback(() => {
    if (canGoBack()) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [canGoBack])

  const handleStepClick = useCallback((stepId: number) => {
    // Allow clicking on completed steps or current step
    const clickedStep = pipelineSteps[stepId - 1]
    const isAccessible = 
      clickedStep.status === 'completed' || 
      clickedStep.status === 'in_progress' ||
      stepId <= currentStep

    if (isAccessible) {
      setCurrentStep(stepId)
    }
  }, [currentStep, pipelineSteps])

  const handleDataChange = useCallback((dataOrUpdater: CycleData | ((prev: CycleData) => CycleData)) => {
    if (typeof dataOrUpdater === 'function') {
      setCycleData((prev) => {
        const updated = dataOrUpdater(prev)
        setHasUnsavedChanges(true)
        return updated
      })
    } else {
      setCycleData(dataOrUpdater)
      setHasUnsavedChanges(true)
    }
  }, [])

  const handleComplete = useCallback(() => {
    // Mark current step as completed and move to next
    handleNext()
  }, [handleNext])

  const handleSaveProgress = useCallback(async () => {
    if (!cycleData.month || !cycleData.year) {
      console.warn('Cannot save progress: No cycle month/year set')
      return
    }

    setIsSavingProgress(true)
    try {
      // Build step data from cycle data
      const stepData: PipelineProgressData['stepData'] = {
        setupCompleted: cycleData.setupComplete,
        employeesSelected: Boolean(cycleData.cycle && cycleData.cycleId),
        templateAssigned: Boolean(cycleData.template),
        salariesProcessed: cycleData.allProcessed,
        reviewCompleted: cycleData.allReviewed,
        finalApproved: cycleData.approved,
        // Include full cycle data for restoration
        cycleId: cycleData.cycleId,
        cycle: cycleData.cycle,
        template: cycleData.template,
        employeesVerified: cycleData.employeesVerified,
        attendanceImported: cycleData.attendanceImported,
        processingProgress: cycleData.processingProgress,
        failedCount: cycleData.failedCount,
        pendingReviewCount: cycleData.pendingReviewCount,
        payoutInitiated: cycleData.payoutInitiated,
        payoutComplete: cycleData.payoutComplete,
      }

      await savePipelineProgress(cycleData.month, cycleData.year, currentStep, stepData)
      setHasUnsavedChanges(false)
      setHasSavedProgress(true)
      
      toast({
        title: 'Progress Saved',
        description: 'Your pipeline progress has been saved.',
      })
    } catch (error) {
      console.error('Failed to save progress:', error)
      toast({
        title: 'Save Failed',
        description: 'Could not save progress. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingProgress(false)
    }
  }, [currentStep, cycleData, toast])

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      const month = cycleData.month || new Date().getMonth() + 1
      const year = cycleData.year || new Date().getFullYear()

      setIsLoadingProgress(true)
      try {
        const response = await getPipelineProgress(month, year)
        
        if (response.success && response.data) {
          const { currentStep: savedStep, stepData } = response.data
          
          // Restore cycle data from step data
          const restoredCycleData: CycleData = {
            ...INITIAL_CYCLE_DATA,
            month,
            year,
            cycleId: stepData.cycleId,
            cycle: stepData.cycle,
            template: stepData.template,
            setupComplete: stepData.setupCompleted || false,
            employeesVerified: stepData.employeesVerified || false,
            attendanceImported: stepData.attendanceImported || false,
            allProcessed: stepData.salariesProcessed || false,
            processingProgress: stepData.processingProgress || 0,
            failedCount: stepData.failedCount || 0,
            allReviewed: stepData.reviewCompleted || false,
            pendingReviewCount: stepData.pendingReviewCount || 0,
            approved: stepData.finalApproved || false,
            payoutInitiated: stepData.payoutInitiated || false,
            payoutComplete: stepData.payoutComplete || false,
          }

          setCurrentStep(savedStep)
          setCycleData(restoredCycleData)
          setHasSavedProgress(true)
          
          toast({
            title: 'Progress Restored',
            description: `Resumed from step ${savedStep}: ${PIPELINE_STEPS[savedStep - 1].name}`,
          })
        }
      } catch (error) {
        console.error('Failed to load saved progress:', error)
        // Don't show error toast on first load - just continue normally
      } finally {
        setIsLoadingProgress(false)
      }
    }

    loadProgress()
  }, []) // Only run on mount

  // Auto-save progress when step or data changes
  useEffect(() => {
    if (hasUnsavedChanges && !isLoadingProgress && cycleData.month && cycleData.year) {
      const timer = setTimeout(() => {
        handleSaveProgress()
      }, 2000) // Debounce: save 2 seconds after last change
      
      return () => clearTimeout(timer)
    }
  }, [hasUnsavedChanges, isLoadingProgress, cycleData.month, cycleData.year, handleSaveProgress])

  // Clear progress after final completion
  useEffect(() => {
    const clearProgressAfterCompletion = async () => {
      if (cycleData.payoutComplete && hasSavedProgress && cycleData.month && cycleData.year) {
        try {
          await clearPipelineProgress(cycleData.month, cycleData.year)
          setHasSavedProgress(false)
          
          toast({
            title: 'Pipeline Complete',
            description: 'Progress has been cleared. Starting fresh next time.',
          })
        } catch (error) {
          console.error('Failed to clear progress:', error)
        }
      }
    }

    clearProgressAfterCompletion()
  }, [cycleData.payoutComplete, cycleData.month, cycleData.year, hasSavedProgress, toast])

  const overallProgress = Math.round(
    (pipelineSteps.filter((s) => s.status === 'completed').length / pipelineSteps.length) * 100
  )

  return (
    <div className="w-full h-screen overflow-y-auto bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Payroll Processing Pipeline</h1>
              <p className="text-sm text-muted-foreground">
                End-to-end payroll workflow • {cycleData.month ? `${cycleData.month}/${cycleData.year}` : 'No cycle selected'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                Progress: {overallProgress}%
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveProgress}
                disabled={!hasUnsavedChanges || isSavingProgress || isLoadingProgress}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingProgress ? 'Saving...' : hasUnsavedChanges ? 'Save Progress' : 'Saved'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Pipeline Visualization */}
      <div className="border-b bg-card">
        <div className="w-full px-6 py-8">
          <PipelineVisualization
            steps={pipelineSteps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Active Step Content */}
      <main className="w-full px-6 py-8">
        <div className="space-y-6">
          {/* Step Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold">{activeStep.name}</h2>
                <Badge variant={getStepStatusVariant(activeStep.status)}>
                  {getStepStatusLabel(activeStep.status)}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                {activeStep.description}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {pipelineSteps.length}
            </div>
          </div>

          {/* Warnings/Errors */}
          {activeStep.status === 'failed' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Step Failed</AlertTitle>
              <AlertDescription>
                There were errors in this step. Please resolve them before continuing.
              </AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          <Card>
            <CardContent className="p-6">
              <ActiveStepComponent
                cycleData={cycleData}
                onDataChange={handleDataChange}
                onNext={handleNext}
                onBack={handleBack}
                onComplete={handleComplete}
                isActive={true}
              />
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              disabled={!canGoBack()}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Step
            </Button>

            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                {pipelineSteps.filter((s) => s.status === 'completed').length} of {pipelineSteps.length} steps completed
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleNext}
              disabled={!canGoNext()}
            >
              {currentStep === pipelineSteps.length ? 'Complete Pipeline' : 'Next Step'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PayrollPipelinePage
