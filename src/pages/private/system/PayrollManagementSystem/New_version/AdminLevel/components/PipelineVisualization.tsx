import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, Clock, ArrowRight, Loader2, Circle } from 'lucide-react'
import { PipelineStepDefinition, StepStatus } from '../PayrollPipelinePage'

interface PipelineVisualizationProps {
  steps: PipelineStepDefinition[]
  currentStep: number
  onStepClick: (stepId: number) => void
}

const getStepIcon = (status: StepStatus, isActive: boolean) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-8 w-8 text-green-600" />
    case 'failed':
      return <XCircle className="h-8 w-8 text-red-600" />
    case 'in_progress':
      return <Loader2 className="h-8 w-8 text-primary animate-spin" />
    case 'skipped':
      return <Circle className="h-8 w-8 text-muted-foreground" />
    default:
      return (
        <span
          className={cn(
            'text-lg font-bold',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {/* Step number will be rendered by parent */}
        </span>
      )
  }
}

const getStepStatusColor = (status: StepStatus, isActive: boolean) => {
  if (isActive) {
    return 'border-primary ring-4 ring-primary/20 bg-primary/5'
  }

  switch (status) {
    case 'completed':
      return 'border-green-500 bg-green-50'
    case 'failed':
      return 'border-red-500 bg-red-50'
    case 'in_progress':
      return 'border-primary bg-primary/5'
    case 'skipped':
      return 'border-muted bg-muted'
    default:
      return 'border-muted bg-card'
  }
}

const getStepLabelColor = (status: StepStatus, isActive: boolean) => {
  if (isActive) {
    return 'text-primary font-semibold'
  }

  switch (status) {
    case 'completed':
      return 'text-green-600'
    case 'failed':
      return 'text-red-600'
    case 'in_progress':
      return 'text-primary'
    case 'skipped':
      return 'text-muted-foreground'
    default:
      return 'text-muted-foreground'
  }
}

const PipelineVisualization = ({ steps, currentStep, onStepClick }: PipelineVisualizationProps) => {
  const completedSteps = steps.filter((s) => s.status === 'completed').length
  const progressPercentage = steps.length > 1 ? (completedSteps / (steps.length - 1)) * 100 : 0

  return (
    <div className="relative">
      {/* Background Progress Line */}
      <div className="absolute top-8 left-0 right-0 h-1 bg-muted -z-10">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Steps Container */}
      <div className="relative flex justify-between items-start">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep
          const isCompleted = step.status === 'completed'
          const isFailed = step.status === 'failed'
          const isInProgress = step.status === 'in_progress'
          const isClickable =
            isCompleted || isInProgress || step.id <= currentStep

          const showIcon = isCompleted || isFailed || isInProgress

          return (
            <div key={step.id} className="relative flex flex-col items-center flex-1">
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  'relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 transition-all',
                  'hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  getStepStatusColor(step.status, isActive),
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                )}
                aria-label={`${step.name} - ${step.status}`}
                aria-current={isActive ? 'step' : undefined}
              >
                {showIcon ? (
                  getStepIcon(step.status, isActive)
                ) : (
                  <span
                    className={cn(
                      'text-lg font-bold',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {step.id}
                  </span>
                )}
              </button>

              {/* Step Label */}
              <div className="mt-3 text-center max-w-[120px]">
                <div
                  className={cn(
                    'text-sm font-medium transition-colors',
                    getStepLabelColor(step.status, isActive)
                  )}
                >
                  {step.shortName}
                </div>
                {isActive && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Current Step
                  </div>
                )}
                {isCompleted && (
                  <div className="text-xs text-green-600 mt-1">
                    ✓ Completed
                  </div>
                )}
                {isFailed && (
                  <div className="text-xs text-red-600 mt-1">
                    × Failed
                  </div>
                )}
                {isInProgress && !isActive && (
                  <div className="text-xs text-primary mt-1">
                    In Progress
                  </div>
                )}
              </div>

              {/* Connector Arrow (not on last step) */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-8 left-1/2 transform -translate-y-1/2',
                    'w-full flex items-center justify-center pointer-events-none'
                  )}
                  style={{ left: 'calc(50% + 32px)', width: 'calc(100% - 64px)' }}
                >
                  <ArrowRight
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isCompleted ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress Text */}
      <div className="mt-6 text-center">
        <div className="text-sm text-muted-foreground">
          {completedSteps} of {steps.length} steps completed •{' '}
          <span className="font-medium text-foreground">
            {Math.round(progressPercentage)}% complete
          </span>
        </div>
      </div>
    </div>
  )
}

export default PipelineVisualization
